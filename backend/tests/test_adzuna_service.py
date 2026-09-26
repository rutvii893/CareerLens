import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient

from ..main import app
from ..services.adzuna_service import (
    AdzunaAPIError,
    clean_html,
    format_salary,
    format_job_type,
    format_posting_date,
    calculate_adzuna_job_match,
    normalize_adzuna_job,
    search_adzuna_jobs,
)

client = TestClient(app)

MOCK_RAW_ADZUNA_RESPONSE = {
    'count': 120,
    'mean': 850000.0,
    'results': [
        {
            'id': '101',
            'title': 'Senior <strong>Python</strong> &amp; React Developer',
            'description': 'We are looking for a skilled developer with experience in <strong>Python</strong>, <strong>React</strong>, <strong>FastAPI</strong>, and Docker.',
            'company': {'display_name': 'TechCorp Solutions'},
            'location': {'display_name': 'Bengaluru, Karnataka', 'area': ['India', 'Karnataka', 'Bengaluru']},
            'salary_min': 1000000.0,
            'salary_max': 1500000.0,
            'salary_is_predicted': '0',
            'contract_time': 'full_time',
            'contract_type': 'permanent',
            'category': {'label': 'IT Jobs', 'tag': 'it-jobs'},
            'redirect_url': 'https://www.adzuna.in/details/101',
            'created': '2026-09-24T10:00:00Z',
        },
        {
            'id': '102',
            'title': 'Junior Java Developer',
            'description': 'Entry level position for Java and Spring Boot engineers in Pune.',
            'company': {'display_name': 'Innovate Inc'},
            'location': {'display_name': 'Pune, Maharashtra'},
            'salary_min': 400000.0,
            'salary_max': 600000.0,
            'salary_is_predicted': '1',
            'contract_time': 'full_time',
            'contract_type': 'permanent',
            'category': {'label': 'Engineering Jobs', 'tag': 'engineering-jobs'},
            'redirect_url': 'https://www.adzuna.in/details/102',
            'created': '2026-09-25T14:30:00Z',
        }
    ]
}


def test_clean_html():
    raw = '<b>Senior</b> <i>Developer</i> &amp; Architect <br/>'
    cleaned = clean_html(raw)
    assert cleaned == 'Senior Developer & Architect'


def test_format_salary():
    assert '₹1,000,000 - ₹1,500,000' in format_salary(1000000, 1500000, country='in')
    assert '$80,000 - $120,000' in format_salary(80000, 120000, country='us')
    assert format_salary(None, None) == 'Salary not disclosed'


def test_format_job_type():
    assert format_job_type('full_time', 'permanent') == 'Full Time • Permanent'
    assert format_job_type('part_time', None) == 'Part Time'
    assert format_job_type(None, None) == 'Full-time'


def test_calculate_adzuna_job_match():
    user_skills = ['Python', 'React', 'FastAPI', 'SQL']
    job_title = 'Senior Python & React Developer'
    job_desc = 'Requires Python, React, FastAPI, Docker, and Kubernetes.'

    score, matched, missing = calculate_adzuna_job_match(job_title, job_desc, user_skills)
    assert 'Python' in matched
    assert 'React' in matched
    assert 'FastAPI' in matched
    assert 'Docker' in missing or 'Kubernetes' in missing
    assert score > 50.0


def test_normalize_adzuna_job():
    raw_job = MOCK_RAW_ADZUNA_RESPONSE['results'][0]
    user_skills = ['Python', 'React']

    normalized = normalize_adzuna_job(raw_job, country='in', user_skills=user_skills)
    assert normalized['id'] == '101'
    assert normalized['title'] == 'Senior Python & React Developer'
    assert normalized['company'] == 'TechCorp Solutions'
    assert normalized['location'] == 'Bengaluru, Karnataka'
    assert 'Python' in normalized['matched_skills']
    assert normalized['source'] == 'adzuna'
    assert normalized['redirect_url'] == 'https://www.adzuna.in/details/101'


@pytest.mark.asyncio
async def test_search_adzuna_jobs_success():
    with patch('httpx.AsyncClient.get') as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = MOCK_RAW_ADZUNA_RESPONSE
        mock_get.return_value = mock_response

        with patch('backend.services.adzuna_service.settings') as mock_settings:
            mock_settings.adzuna_app_id = 'test_app_id'
            mock_settings.adzuna_app_key = 'test_app_key'
            mock_settings.adzuna_country = 'in'

            result = await search_adzuna_jobs(
                query='Python Developer',
                location='Bengaluru',
                page=1,
                results_per_page=10,
                user_skills=['Python', 'React'],
            )

            assert result['total_count'] == 120
            assert len(result['results']) == 2
            assert result['results'][0]['title'] == 'Senior Python & React Developer'
            assert result['personalized'] is True


@pytest.mark.asyncio
async def test_search_adzuna_jobs_missing_credentials():
    with patch('backend.services.adzuna_service.settings') as mock_settings:
        mock_settings.adzuna_app_id = None
        mock_settings.adzuna_app_key = None

        with pytest.raises(AdzunaAPIError) as exc_info:
            await search_adzuna_jobs(query='Developer')
        assert exc_info.value.status_code == 503


def test_jobs_search_endpoint_integration():
    mock_normalized_result = {
        'results': [
            {
                'id': '101',
                'title': 'Frontend Engineer',
                'company': 'Awesome Org',
                'location': 'Mumbai, India',
                'description': 'Building world-class web applications with React and TypeScript.',
                'salary_min': 800000.0,
                'salary_max': 1200000.0,
                'formatted_salary': '₹800,000 - ₹1,200,000',
                'salary_is_predicted': False,
                'job_type': 'Full-time',
                'category': 'IT Jobs',
                'redirect_url': 'https://www.adzuna.in/details/101',
                'created': 'Sep 24, 2026',
                'match_score': 85.0,
                'matched_skills': ['React'],
                'missing_skills': ['TypeScript'],
                'source': 'adzuna',
            }
        ],
        'total_count': 1,
        'page': 1,
        'results_per_page': 10,
        'total_pages': 1,
        'country': 'in',
        'personalized': True,
        'user_skills_used': ['React'],
    }

    with patch('backend.routers.jobs.search_adzuna_jobs', new_callable=AsyncMock) as mock_search:
        mock_search.return_value = mock_normalized_result

        response = client.get('/api/v1/jobs/search?query=Frontend&location=Mumbai')
        assert response.status_code == 200
        data = response.json()
        assert data['total_count'] == 1
        assert len(data['results']) == 1
        assert data['results'][0]['title'] == 'Frontend Engineer'
        assert data['results'][0]['match_score'] == 85.0
        assert data['results'][0]['redirect_url'] == 'https://www.adzuna.in/details/101'
