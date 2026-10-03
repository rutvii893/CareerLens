from uuid import uuid4
import pytest
from fastapi.testclient import TestClient

from backend.database import Base, engine, SessionLocal, sync_database_schema
from backend.main import app
from backend.services.career_intelligence import ensure_default_roles

client = TestClient(app)


@pytest.fixture(scope='module', autouse=True)
def setup_test_environment():
    Base.metadata.create_all(bind=engine)
    sync_database_schema()
    with SessionLocal() as db:
        ensure_default_roles(db)
    yield


def _register_user(name_suffix: str = ''):
    email = f'user-{uuid4().hex[:8]}@careerlens.io'
    reg = client.post(
        '/api/v1/auth/register',
        json={'name': f'Tester {name_suffix}', 'email': email, 'password': 'password123', 'role': 'student'}
    )
    assert reg.status_code == 201

    login = client.post('/api/v1/auth/login', json={'email': email, 'password': 'password123'})
    assert login.status_code == 200
    token = login.json()['access_token']
    return {'Authorization': f'Bearer {token}'}, email


def test_target_role_selection_and_skill_gap_calculation():
    headers, _ = _register_user('TargetRole')

    # 1. Update target role to Frontend Developer with 90% target benchmark
    goal_res = client.put(
        '/api/v1/users/me/target-goal',
        json={'target_role': 'Frontend Developer', 'target_score': 90.0},
        headers=headers
    )
    assert goal_res.status_code == 200
    assert goal_res.json()['target_role'] == 'Frontend Developer'

    # 2. Get skills and verify required skills and gap percentage
    skills_res = client.get('/api/v1/users/me/skills', headers=headers)
    assert skills_res.status_code == 200
    skills_data = skills_res.json()
    assert skills_data['target_role'] == 'Frontend Developer'
    assert skills_data['target_score'] == 90.0
    assert len(skills_data['assessments']) > 0
    # Initially without custom skills or resume, overall skill gap is 100%
    assert skills_data['overall_skill_gap_percentage'] == 100.0

    # 3. Add custom skills React and JavaScript with assessments
    client.post('/api/v1/users/me/skills', json={'skill_name': 'React', 'current_score': 85.0}, headers=headers)
    client.post('/api/v1/users/me/skills', json={'skill_name': 'JavaScript', 'current_score': 90.0}, headers=headers)

    # 4. Check updated skills and gap
    skills_after = client.get('/api/v1/users/me/skills', headers=headers).json()
    assert 'React' in skills_after['all_skills']
    assert 'JavaScript' in skills_after['all_skills']
    # Overall skill gap must have decreased because JavaScript and React now meet or near target
    assert skills_after['overall_skill_gap_percentage'] < 100.0

    # 5. Check Dashboard metrics reflect the updated target role & skill gap
    dash_res = client.get('/api/v1/users/me/dashboard', headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data['target_role'] == 'Frontend Developer'
    assert dash_data['overall_skill_gap'] == skills_after['overall_skill_gap_percentage']
    assert dash_data['target_score'] == 90.0
    assert 'skills_gaps' in dash_data['service_breakdowns']
    assert len(dash_data['service_breakdowns']['skills_gaps']['chart_data']) > 0


def test_dashboard_job_recommendations_based_on_target_role():
    headers, _ = _register_user('JobRecom')

    # Seed job listings for Backend, Frontend, and Data Engineer
    client.post('/api/v1/matching/jobs', json={
        'title': 'Frontend React Engineer',
        'company': 'Pixel Craft',
        'description': 'We need a React and TypeScript expert for our frontend team.',
        'location': 'Remote'
    }, headers=headers)

    client.post('/api/v1/matching/jobs', json={
        'title': 'Senior Python Backend Architect',
        'company': 'Data Server Inc',
        'description': 'We need a Python FastAPI PostgreSQL developer for backend microservices.',
        'location': 'New York, NY'
    }, headers=headers)

    client.post('/api/v1/matching/jobs', json={
        'title': 'Senior Data Engineer',
        'company': 'Pipeline Stream Labs',
        'description': 'Building large scale ETL pipelines and data warehouses with Python, SQL, Spark and Kafka.',
        'location': 'Remote'
    }, headers=headers)

    # 1. Set target role to Data Engineer
    client.put(
        '/api/v1/users/me/target-goal',
        json={'target_role': 'Data Engineer', 'target_score': 85.0},
        headers=headers
    )
    # Add Python and SQL skills
    client.post('/api/v1/users/me/skills', json={'skill_name': 'Python', 'current_score': 85.0}, headers=headers)
    client.post('/api/v1/users/me/skills', json={'skill_name': 'SQL', 'current_score': 80.0}, headers=headers)

    dash_de = client.get('/api/v1/users/me/dashboard', headers=headers).json()
    assert 1 <= len(dash_de['recommended_jobs']) <= 2
    for job in dash_de['recommended_jobs']:
        # Must only recommend Data Engineer / Data Platform jobs, NOT Frontend or Backend
        assert 'Frontend' not in job['title']
        assert 'React' not in job['title']
        assert 'Data' in job['title'] or 'ETL' in job['title']
        assert job['tier'] == 'Direct Match'

    # 2. Change target role to Frontend Developer
    client.put(
        '/api/v1/users/me/target-goal',
        json={'target_role': 'Frontend Developer', 'target_score': 80.0},
        headers=headers
    )
    # Add frontend skills
    client.post('/api/v1/users/me/skills', json={'skill_name': 'React', 'current_score': 80.0}, headers=headers)

    dash_fe = client.get('/api/v1/users/me/dashboard', headers=headers).json()
    assert 1 <= len(dash_fe['recommended_jobs']) <= 2
    top_fe_job = dash_fe['recommended_jobs'][0]
    assert 'Frontend' in top_fe_job['title'] or 'React' in top_fe_job['title']
    assert top_fe_job['tier'] == 'Direct Match'

    # 3. Now change target role to Backend Engineer
    client.put(
        '/api/v1/users/me/target-goal',
        json={'target_role': 'Backend Engineer', 'target_score': 85.0},
        headers=headers
    )
    # Add backend skills
    client.post('/api/v1/users/me/skills', json={'skill_name': 'FastAPI', 'current_score': 80.0}, headers=headers)

    dash_be = client.get('/api/v1/users/me/dashboard', headers=headers).json()
    assert 1 <= len(dash_be['recommended_jobs']) <= 2
    top_be_job = dash_be['recommended_jobs'][0]
    assert 'Backend' in top_be_job['title'] or 'Python' in top_be_job['title']
    assert top_be_job['tier'] == 'Direct Match'


def test_career_roadmap_generation_and_phase_completion():
    headers, _ = _register_user('Roadmap')

    # Generate roadmap for Data Scientist
    roadmap_gen = client.post(
        '/api/v1/career/roadmap',
        json={'target_role': 'Data Scientist'},
        headers=headers
    )
    assert roadmap_gen.status_code == 200
    roadmap_data = roadmap_gen.json()
    assert roadmap_data['target_role'] == 'Data Scientist'
    assert len(roadmap_data['roadmap']) > 0
    roadmap_id = roadmap_data['id']

    # Complete first phase milestone
    toggle_phase = client.patch(
        f'/api/v1/career/roadmap/{roadmap_id}/phase/0',
        json={'status': 'completed'},
        headers=headers
    )
    assert toggle_phase.status_code == 200
    updated_roadmap = toggle_phase.json()
    assert updated_roadmap['completed_phases'] >= 1
    assert updated_roadmap['progress_percentage'] > 0

    # Verify dashboard reflects roadmap progress
    dash = client.get('/api/v1/users/me/dashboard', headers=headers).json()
    assert dash['roadmap_progress']['completed_phases'] >= 1
    assert dash['roadmap_progress']['percentage'] == updated_roadmap['progress_percentage']


def test_career_coach_with_target_role_context():
    headers, _ = _register_user('Coach')

    # Set target role and custom skills
    client.put('/api/v1/users/me/target-goal', json={'target_role': 'DevOps Engineer', 'target_score': 80.0}, headers=headers)
    client.post('/api/v1/users/me/skills', json={'skill_name': 'Docker', 'current_score': 80.0}, headers=headers)

    coach_res = client.post(
        '/api/v1/career/coach/ask',
        json={'question': 'What missing skills should I learn for my role?'},
        headers=headers
    )
    assert coach_res.status_code == 200
    ans = coach_res.json()
    assert len(ans['answer']) > 20
    assert ans['target_role'] == 'DevOps Engineer'
    assert 'Docker' in ans['current_skills']


def test_user_data_isolation():
    headers1, _ = _register_user('UserA')
    headers2, _ = _register_user('UserB')

    # User 1 sets target role
    client.put('/api/v1/users/me/target-goal', json={'target_role': 'Data Scientist', 'target_score': 95.0}, headers=headers1)
    client.post('/api/v1/users/me/skills', json={'skill_name': 'PyTorch', 'current_score': 90.0}, headers=headers1)

    # User 2 sets target role
    client.put('/api/v1/users/me/target-goal', json={'target_role': 'Frontend Developer', 'target_score': 75.0}, headers=headers2)
    client.post('/api/v1/users/me/skills', json={'skill_name': 'Vue.js', 'current_score': 70.0}, headers=headers2)

    # Verify User 1 data
    user1_skills = client.get('/api/v1/users/me/skills', headers=headers1).json()
    assert user1_skills['target_role'] == 'Data Scientist'
    assert 'PyTorch' in user1_skills['all_skills']
    assert 'Vue.js' not in user1_skills['all_skills']

    # Verify User 2 data
    user2_skills = client.get('/api/v1/users/me/skills', headers=headers2).json()
    assert user2_skills['target_role'] == 'Frontend Developer'
    assert 'Vue.js' in user2_skills['all_skills']
    assert 'PyTorch' not in user2_skills['all_skills']
