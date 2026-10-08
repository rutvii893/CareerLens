from io import BytesIO
from uuid import uuid4

from fastapi.testclient import TestClient
from pypdf import PdfReader
from sqlalchemy import create_engine, inspect, text

from ..database import Base, engine, ensure_generated_resume_columns
from ..main import app
from ..services.resume_pdf import generate_resume_pdf
from ..services import resume_generator

client = TestClient(app)
RESUMES_URL = '/api/v1/resume-generator/resumes'


def _account():
    email = f'generated-{uuid4()}@example.com'
    password = 'password123'
    registered = client.post(
        '/api/v1/auth/register',
        json={'name': 'Generator Tester', 'email': email, 'password': password, 'role': 'student'},
    )
    assert registered.status_code == 201
    login = client.post('/api/v1/auth/login', json={'email': email, 'password': password})
    assert login.status_code == 200
    return {'Authorization': f"Bearer {login.json()['access_token']}"}


def _resume_payload():
    return {
        'title': 'Data Analyst Resume',
        'career_role': 'Data Analyst',
        'technical_skills': [
            {'name': 'SQL', 'knowledge_percent': 65},
            {'name': 'Python', 'knowledge_percent': 25},
        ],
        'soft_skills': ['Communication'],
        'certifications': [{'name': 'SQL Foundations', 'organization': 'Example Academy', 'issue_date': '2025'}],
        'hackathons': [{'name': 'Campus Buildathon', 'organization': 'Example University', 'date': '2025', 'position': 'Participant'}],
        'projects': [{'name': 'Sales Dashboard', 'description': 'Built an interactive sales dashboard.'}],
        'achievements': [{'title': 'Department Scholarship', 'description': 'Received a department scholarship.'}],
        'education': [{'degree': 'Bachelor of Science', 'institution': 'Example University', 'specialization': 'Statistics', 'graduation_year': '2026'}],
        'experience': [{'company': 'Example Labs', 'role': 'Data Intern', 'start_date': '2025-01', 'end_date': '2025-06', 'responsibilities': 'Prepared reports.'}],
        'contact': {'name': 'Generator Tester', 'email': 'tester@example.com'},
        'summary': 'Candidate summary entered by the user.',
        'current_step': 11,
    }


def test_generated_resume_crud_and_owner_isolation():
    Base.metadata.create_all(bind=engine)
    owner_headers = _account()
    other_headers = _account()
    payload = _resume_payload()

    invalid_payload = {**payload, 'technical_skills': [{'name': 'SQL', 'knowledge_percent': 101}]}
    assert client.post(RESUMES_URL, headers=owner_headers, json=invalid_payload).status_code == 422

    created = client.post(RESUMES_URL, headers=owner_headers, json=payload)
    assert created.status_code == 201
    saved = created.json()
    resume_id = saved['id']
    assert saved['technical_skills'][0]['knowledge_percent'] == 65
    assert saved['template'] == 'classic'
    assert saved['certifications'][0]['name'] == 'SQL Foundations'
    assert saved['projects'][0]['name'] == 'Sales Dashboard'
    assert saved['achievements'][0]['title'] == 'Department Scholarship'

    listing = client.get(RESUMES_URL, headers=owner_headers)
    assert listing.status_code == 200
    assert [item['id'] for item in listing.json()] == [resume_id]

    fetched = client.get(f'{RESUMES_URL}/{resume_id}', headers=owner_headers)
    assert fetched.status_code == 200
    assert fetched.json()['career_role'] == 'Data Analyst'

    assert client.get(f'{RESUMES_URL}/{resume_id}', headers=other_headers).status_code == 404
    assert client.put(f'{RESUMES_URL}/{resume_id}', headers=other_headers, json=payload).status_code == 404
    assert client.delete(f'{RESUMES_URL}/{resume_id}', headers=other_headers).status_code == 404
    assert client.get(f'{RESUMES_URL}/{resume_id}/pdf', headers=other_headers).status_code == 404

    templates = client.get('/api/v1/resume-generator/templates', headers=owner_headers)
    assert templates.status_code == 200
    assert {template['id'] for template in templates.json()} == {
        'classic', 'modern', 'minimal', 'professional', 'student',
    }
    for template in ('classic', 'modern', 'minimal', 'professional', 'student'):
        pdf = client.get(f'{RESUMES_URL}/{resume_id}/pdf?template={template}', headers=owner_headers)
        assert pdf.status_code == 200
        assert pdf.headers['content-type'] == 'application/pdf'
        assert pdf.headers['content-disposition'].endswith(f'{template}.pdf"')
        text = '\n'.join(page.extract_text() or '' for page in PdfReader(BytesIO(pdf.content)).pages)
        assert 'Data Analyst' in text
        assert 'SQL (65%)' in text
        assert 'Sales Dashboard' in text
        assert 'Candidate summary entered by the user.' in text
        assert 'Example University' in text
        assert 'Data Intern' in text
        assert 'Campus Buildathon' in text
    assert client.get(f'{RESUMES_URL}/{resume_id}/pdf').status_code in (401, 403)
    assert client.get(f'{RESUMES_URL}/{resume_id}/pdf?template=unsupported', headers=owner_headers).status_code == 422

    payload['technical_skills'][0]['knowledge_percent'] = 80
    payload['template'] = 'student'
    payload['current_step'] = 12
    updated = client.put(f'{RESUMES_URL}/{resume_id}', headers=owner_headers, json=payload)
    assert updated.status_code == 200
    assert updated.json()['technical_skills'][0]['knowledge_percent'] == 80
    assert updated.json()['template'] == 'student'
    assert updated.json()['current_step'] == 12

    deleted = client.delete(f'{RESUMES_URL}/{resume_id}', headers=owner_headers)
    assert deleted.status_code == 204
    assert client.get(f'{RESUMES_URL}/{resume_id}', headers=owner_headers).status_code == 404


def test_generated_resume_requires_authentication():
    response = client.get(RESUMES_URL)
    assert response.status_code in (401, 403)


def test_summary_generation_uses_deterministic_fallback(monkeypatch):
    class UnavailableGemini:
        available = False

    monkeypatch.setattr(resume_generator, 'GeminiService', UnavailableGemini)
    payload = resume_generator.GeneratedResumeUpsert.model_validate(_resume_payload())

    summary = resume_generator.generate_summary(payload)

    assert 'Data Analyst' in summary
    assert 'SQL' in summary and 'Python' in summary
    assert '65%' not in summary
    assert 'experience' not in summary.lower()


def test_generated_resume_pdf_preserves_content_across_pages():
    payload = _resume_payload()
    payload['projects'] = [
        {
            'name': f'Portfolio Project {index}',
            'description': ('Documented student project details. ' * 70) + f'PAGE_MARKER_{index}',
        }
        for index in range(1, 9)
    ]

    pdf = generate_resume_pdf(payload, 'modern')
    pages = PdfReader(BytesIO(pdf)).pages
    text = '\n'.join(page.extract_text() or '' for page in pages)

    assert len(pages) > 1
    assert 'Portfolio Project 8' in text
    assert 'PAGE_MARKER_8' in text


def test_existing_generated_resume_table_gets_default_template_column():
    legacy_engine = create_engine('sqlite://')
    try:
        with legacy_engine.begin() as connection:
            connection.execute(text('CREATE TABLE generated_resumes (id INTEGER PRIMARY KEY)'))

        ensure_generated_resume_columns(legacy_engine)

        columns = {column['name']: column for column in inspect(legacy_engine).get_columns('generated_resumes')}
        assert columns['template']['type'].length == 32
        with legacy_engine.connect() as connection:
            connection.execute(text('INSERT INTO generated_resumes (id) VALUES (1)'))
            assert connection.execute(text('SELECT template FROM generated_resumes WHERE id = 1')).scalar_one() == 'classic'
    finally:
        legacy_engine.dispose()
