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

def _register_user():
    email = f'user-{uuid4().hex[:8]}@careerlens.io'
    reg = client.post(
        '/api/v1/auth/register',
        json={'name': 'Sync Tester', 'email': email, 'password': 'password123', 'role': 'student'}
    )
    assert reg.status_code == 201

    login = client.post('/api/v1/auth/login', json={'email': email, 'password': 'password123'})
    assert login.status_code == 200
    token = login.json()['access_token']
    return {'Authorization': f'Bearer {token}'}, email

def test_roadmap_task_completion_syncs_skill_progress_and_gap():
    headers, email = _register_user()

    # Set target role to Data Engineer
    tg_res = client.put('/api/v1/users/me/target-goal', json={'target_role': 'Data Engineer', 'target_score': 80.0}, headers=headers)
    assert tg_res.status_code == 200

    # Fetch roadmap
    rm_res = client.get('/api/v1/career/roadmap', headers=headers)
    assert rm_res.status_code == 200
    roadmap_data = rm_res.json()
    roadmap_id = roadmap_data['id']

    # Fetch initial skills response & dashboard
    skills_before = client.get('/api/v1/users/me/skills', headers=headers).json()
    dash_before = client.get('/api/v1/users/me/dashboard', headers=headers).json()

    # Find task p2_t1 (associated with missing skill in Phase 2)
    phase2 = roadmap_data['roadmap'][1]
    task_p2_t1 = phase2['tasks'][0]
    assoc_skill = task_p2_t1['associated_skill']

    # Check skill progress before completing task
    skill_item_before = next((s for s in skills_before['assessments'] if s['name'] == assoc_skill), None)
    progress_before = skill_item_before['learning_progress'] if skill_item_before else 0.0

    # Complete task p2_t1 via API
    patch_res = client.patch(
        f'/api/v1/career/roadmap/{roadmap_id}/phase/1',
        json={'task_id': task_p2_t1['task_id'], 'task_completed': True},
        headers=headers,
    )
    assert patch_res.status_code == 200

    # Fetch updated skills response & dashboard
    skills_after = client.get('/api/v1/users/me/skills', headers=headers).json()
    dash_after = client.get('/api/v1/users/me/dashboard', headers=headers).json()

    skill_item_after = next((s for s in skills_after['assessments'] if s['name'] == assoc_skill), None)
    assert skill_item_after is not None
    assert skill_item_after['learning_progress'] > progress_before

    # Verify skill gap changed appropriately
    assert dash_after['overall_skill_gap'] <= dash_before['overall_skill_gap']
