from io import BytesIO
from uuid import uuid4

from docx import Document
from fastapi.testclient import TestClient
import pytest

from backend.database import Base, engine
from backend.main import app
from backend.services.career_intelligence import ensure_default_roles


client = TestClient(app)


@pytest.fixture(scope='module', autouse=True)
def ensure_tables_and_roles():
    Base.metadata.create_all(bind=engine)
    from backend.database import SessionLocal
    with SessionLocal() as db:
        ensure_default_roles(db)
    yield


def _resume_bytes() -> bytes:
    document = Document()
    for line in ('SUMMARY', 'Backend engineer', 'SKILLS', 'Python FastAPI PostgreSQL', 'EXPERIENCE', 'Built APIs', 'EDUCATION', 'BS Computer Science', 'PROJECTS', 'CareerLens'):
        document.add_paragraph(line)
    stream = BytesIO()
    document.save(stream)
    return stream.getvalue()


def test_job_and_career_intelligence_flow():
    email = f'intelligence-{uuid4()}@example.com'
    credentials = {'name': 'Intelligence Tester', 'email': email, 'password': 'password123', 'role': 'student'}
    assert client.post('/api/v1/auth/register', json=credentials).status_code == 201
    login = client.post('/api/v1/auth/login', json={'email': email, 'password': credentials['password']})
    headers = {'Authorization': f"Bearer {login.json()['access_token']}"}

    upload = client.post(
        '/api/v1/resumes/upload',
        headers=headers,
        files={'file': ('resume.docx', _resume_bytes(), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')},
    )
    resume_id = upload.json()['id']

    job = client.post('/api/v1/matching/jobs', headers=headers, json={
        'title': 'Backend Engineer',
        'company': 'CareerLens Labs',
        'description': 'Build services with Python FastAPI PostgreSQL Docker and Git.',
        'location': 'Remote',
    })
    assert job.status_code == 201
    job_id = job.json()['id']
    assert 'Docker' in job.json()['required_skills']

    match = client.post('/api/v1/matching/analyze', headers=headers, json={'resume_id': resume_id, 'job_id': job_id})
    assert match.status_code == 200
    assert match.json()['match_score'] > 0
    assert 'Python' in match.json()['matched_skills']
    assert 'Docker' in match.json()['missing_skills']

    listed = client.get(f'/api/v1/matching/jobs?resumeId={resume_id}', headers=headers)
    assert listed.status_code == 200
    assert any(item['job']['id'] == job_id for item in listed.json())

    roles = client.get('/api/v1/career/roles', headers=headers)
    assert roles.status_code == 200
    assert any(role['name'] == 'Backend Engineer' for role in roles.json())

    career = client.post('/api/v1/career/analyze', headers=headers, json={'resume_id': resume_id, 'target_role': 'Backend Engineer'})
    assert career.status_code == 200
    assert 'Docker' in career.json()['missing_skills']

    roadmap = client.post('/api/v1/career/roadmap', headers=headers, json={'resume_id': resume_id, 'target_role': 'Backend Engineer'})
    assert roadmap.status_code == 200
    assert roadmap.json()['id']
    assert roadmap.json()['roadmap']

    saved = client.get(f'/api/v1/career/roadmap?resumeId={resume_id}', headers=headers)
    assert saved.status_code == 200
    assert saved.json()['id'] == roadmap.json()['id']

    dashboard = client.get('/api/v1/users/me/dashboard', headers=headers)
    assert dashboard.status_code == 200
    dashboard_data = dashboard.json()
    assert dashboard_data['active_resume_id'] == resume_id
    assert dashboard_data['recent_ats_score'] > 0
    assert dashboard_data['job_match_percentage'] > 0
    assert 'Docker' in dashboard_data['missing_skills']
    assert 'Docker' in dashboard_data['career_skill_gap']
