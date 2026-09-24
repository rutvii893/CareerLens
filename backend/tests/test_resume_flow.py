from io import BytesIO
from uuid import uuid4

from docx import Document
from fastapi.testclient import TestClient
import pytest

from backend.database import Base, engine
from backend.main import app


client = TestClient(app)


@pytest.fixture(scope='module', autouse=True)
def ensure_tables():
    Base.metadata.create_all(bind=engine)
    yield


def _docx_bytes() -> bytes:
    document = Document()
    for line in ('SUMMARY', 'Backend engineer', 'SKILLS', 'Python FastAPI PostgreSQL', 'EXPERIENCE', 'Built APIs', 'EDUCATION', 'BS Computer Science', 'PROJECTS', 'CareerLens'):
        document.add_paragraph(line)
    stream = BytesIO()
    document.save(stream)
    return stream.getvalue()


def test_authenticated_resume_upload_and_analysis_flow():
    email = f'resume-{uuid4()}@example.com'
    credentials = {'name': 'Resume Tester', 'email': email, 'password': 'password123', 'role': 'student'}
    register = client.post('/api/v1/auth/register', json=credentials)
    assert register.status_code == 201

    login = client.post('/api/v1/auth/login', json={'email': email, 'password': credentials['password']})
    assert login.status_code == 200
    headers = {'Authorization': f"Bearer {login.json()['access_token']}"}

    upload = client.post(
        '/api/v1/resumes/upload',
        headers=headers,
        files={'file': ('resume.docx', _docx_bytes(), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')},
    )
    assert upload.status_code == 201
    resume_id = upload.json()['id']
    assert upload.json()['status'] == 'analyzed'

    analysis = client.get(f'/api/v1/resumes/{resume_id}/analysis', headers=headers)
    assert analysis.status_code == 200
    body = analysis.json()
    assert body['overall_score'] > 0
    assert 'Python' in body['extracted_skills']
    assert body['section_analysis']['experience']['present'] is True
