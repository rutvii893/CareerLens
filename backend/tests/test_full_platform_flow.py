from uuid import uuid4
import pytest
from fastapi.testclient import TestClient

from backend.database import Base, engine, SessionLocal, sync_database_schema
from backend.main import app
from backend.services.career_intelligence import ensure_default_roles

client = TestClient(app)


@pytest.fixture(scope='module', autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    sync_database_schema()
    with SessionLocal() as db:
        ensure_default_roles(db)
    yield


def test_full_platform_end_to_end():
    email = f'tester-{uuid4().hex[:8]}@careerlens.io'
    # 1. Register and Login
    reg = client.post('/api/v1/auth/register', json={'name': 'Dev Tester', 'email': email, 'password': 'password123', 'role': 'student'})
    assert reg.status_code == 201
    
    login = client.post('/api/v1/auth/login', json={'email': email, 'password': 'password123'})
    assert login.status_code == 200
    token = login.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    # 2. Get Profile & Update Profile
    prof = client.get('/api/v1/users/me', headers=headers)
    assert prof.status_code == 200
    assert prof.json()['name'] == 'Dev Tester'

    upd = client.put('/api/v1/users/me', json={'target_role': 'Full Stack Engineer', 'location': 'San Francisco, CA', 'bio': 'Passionate coder'}, headers=headers)
    assert upd.status_code == 200
    assert upd.json()['target_role'] == 'Full Stack Engineer'

    # 3. Add Custom Skills & Check Skills Dashboard
    add_skill = client.post('/api/v1/users/me/skills', json={'skill_name': 'FastAPI'}, headers=headers)
    assert add_skill.status_code == 200
    assert 'FastAPI' in add_skill.json()['all_skills']

    add_skill2 = client.post('/api/v1/users/me/skills', json={'skill_name': 'React'}, headers=headers)
    assert add_skill2.status_code == 200
    assert 'React' in add_skill2.json()['all_skills']

    # 4. Save and Track a Job
    save_job = client.post('/api/v1/jobs/save', json={
        'job_title': 'Senior Python Developer',
        'company': 'Tech Corp',
        'location': 'Remote',
        'salary': '$120k',
        'status': 'saved',
        'matched_skills': ['FastAPI'],
        'missing_skills': ['Docker'],
        'match_score': 85.0
    }, headers=headers)
    assert save_job.status_code == 201
    job_id = save_job.json()['id']

    # List saved jobs
    saved_list = client.get('/api/v1/jobs/saved', headers=headers)
    assert saved_list.status_code == 200
    assert len(saved_list.json()) >= 1
    assert any(j['id'] == job_id for j in saved_list.json())

    # Update application status
    status_upd = client.patch(f'/api/v1/jobs/saved/{job_id}/status', json={'status': 'applied', 'notes': 'Applied on company portal'}, headers=headers)
    assert status_upd.status_code == 200
    assert status_upd.json()['status'] == 'applied'

    # 5. Start Interview Prep without mandatory resume and evaluate
    start_int = client.post('/api/v1/interview/start', json={'target_role': 'Full Stack Engineer', 'interview_type': 'Mixed'}, headers=headers)
    assert start_int.status_code == 200
    session_id = start_int.json()['id']
    assert len(start_int.json()['questions']) > 0

    eval_ans = client.post('/api/v1/interview/evaluate', json={
        'session_id': session_id,
        'question_id': 1,
        'answer_text': 'I built a high-performance REST API using FastAPI and PostgreSQL with JWT authentication and comprehensive test coverage.'
    }, headers=headers)
    assert eval_ans.status_code == 200
    assert eval_ans.json()['score'] > 0

    # 6. Check Dashboard metrics
    dash = client.get('/api/v1/users/me/dashboard', headers=headers)
    assert dash.status_code == 200
    metrics = dash.json()
    assert metrics['applications_count'] >= 1
    assert len(metrics['recent_interviews']) >= 1
    assert len(metrics['recent_activity']) > 0
