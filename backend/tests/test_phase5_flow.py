from io import BytesIO
from uuid import uuid4

from docx import Document
from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


def _resume_bytes() -> bytes:
    document = Document()
    for line in ('SUMMARY', 'Backend engineer', 'SKILLS', 'Python FastAPI PostgreSQL', 'EXPERIENCE', 'Built APIs', 'EDUCATION', 'BS Computer Science', 'PROJECTS', 'CareerLens'):
        document.add_paragraph(line)
    stream = BytesIO()
    document.save(stream)
    return stream.getvalue()


def test_interview_and_career_coach_flow():
    email = f'phase5-{uuid4()}@example.com'
    credentials = {'name': 'Phase Five Tester', 'email': email, 'password': 'password123', 'role': 'student'}
    assert client.post('/api/v1/auth/register', json=credentials).status_code == 201
    login = client.post('/api/v1/auth/login', json={'email': email, 'password': credentials['password']})
    headers = {'Authorization': f"Bearer {login.json()['access_token']}"}

    upload = client.post(
        '/api/v1/resumes/upload',
        headers=headers,
        files={'file': ('resume.docx', _resume_bytes(), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')},
    )
    resume_id = upload.json()['id']

    started = client.post('/api/v1/interview/start', headers=headers, json={
        'resume_id': resume_id,
        'target_role': 'Backend Engineer',
        'interview_type': 'Mixed',
    })
    assert started.status_code == 200
    session = started.json()
    assert session['questions']
    question = session['questions'][0]

    evaluated = client.post('/api/v1/interview/evaluate', headers=headers, json={
        'session_id': session['id'],
        'question_id': question['id'],
        'answer_text': 'In my project I used Python to build an API, chose FastAPI for clear validation, and measured the result with faster response handling.',
    })
    assert evaluated.status_code == 200
    assert evaluated.json()['score'] > 0

    saved = client.get(f"/api/v1/interview/{session['id']}", headers=headers)
    assert saved.status_code == 200
    assert saved.json()['answers']
    assert saved.json()['feedback']

    coach = client.post('/api/v1/career/coach/ask', headers=headers, json={
        'resume_id': resume_id,
        'target_role': 'Backend Engineer',
        'question': 'What should I learn next for this role?',
    })
    assert coach.status_code == 200
    assert coach.json()['provider'] in {'gemini', 'deterministic_fallback'}
    assert 'Python' in coach.json()['current_skills']
    assert 'Docker' in coach.json()['missing_skills']
