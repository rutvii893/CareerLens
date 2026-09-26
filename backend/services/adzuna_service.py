from __future__ import annotations

import html
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import httpx

from ..config import settings
from .resume_intelligence import SKILL_CATALOG, _contains_skill


class AdzunaAPIError(Exception):
    """Raised when an error occurs while communicating with the Adzuna API."""

    def __init__(self, message: str, status_code: int = 502, detail: Optional[str] = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.detail = detail or message


COUNTRY_CURRENCY_MAP = {
    'in': '₹',
    'us': '$',
    'gb': '£',
    'uk': '£',
    'ca': 'CA$',
    'au': 'AU$',
    'nz': 'NZ$',
    'de': '€',
    'fr': '€',
    'it': '€',
    'es': '€',
    'nl': '€',
    'pl': 'zł',
    'sg': 'S$',
    'za': 'R',
}


def clean_html(raw_html: Optional[str]) -> str:
    """Strip HTML tags, unescape entities, and clean extra whitespace."""
    if not raw_html:
        return ''
    text = re.sub(r'<[^>]+>', ' ', raw_html)
    text = html.unescape(text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def format_salary(
    salary_min: Optional[float],
    salary_max: Optional[float],
    country: str = 'in',
    is_predicted: Optional[Any] = None,
) -> str:
    """Format salary min and max with appropriate currency symbols."""
    symbol = COUNTRY_CURRENCY_MAP.get(country.lower(), '$')

    if salary_min is not None and salary_max is not None and salary_min > 0 and salary_max > 0:
        if salary_min == salary_max:
            return f'{symbol}{int(salary_min):,}'
        return f'{symbol}{int(salary_min):,} - {symbol}{int(salary_max):,}'
    elif salary_min is not None and salary_min > 0:
        return f'From {symbol}{int(salary_min):,}'
    elif salary_max is not None and salary_max > 0:
        return f'Up to {symbol}{int(salary_max):,}'

    return 'Salary not disclosed'


def format_job_type(contract_time: Optional[str], contract_type: Optional[str]) -> str:
    """Format contract_time ('full_time', 'part_time') and contract_type ('permanent', 'contract')."""
    parts = []
    if contract_time:
        formatted_time = contract_time.replace('_', ' ').title()
        parts.append(formatted_time)
    if contract_type:
        formatted_type = contract_type.replace('_', ' ').title()
        parts.append(formatted_type)
    return ' • '.join(parts) if parts else 'Full-time'


def format_posting_date(created_str: Optional[str]) -> str:
    """Format Adzuna ISO date string into human readable relative or short date."""
    if not created_str:
        return 'Recently'
    try:
        dt = datetime.fromisoformat(created_str.replace('Z', '+00:00'))
        return dt.strftime('%b %d, %Y')
    except Exception:
        return created_str[:10] if len(created_str) >= 10 else 'Recently'


def calculate_adzuna_job_match(
    job_title: str,
    job_description: str,
    user_skills: List[str],
) -> Tuple[float, List[str], List[str]]:
    """
    Compute CareerLens match score and identified matched/missing skills
    between user skills and the live Adzuna job posting.
    """
    if not user_skills:
        return 0.0, [], []

    full_job_text = f'{job_title} {job_description}'.lower()

    # 1. Identify skills relevant to this specific job from the master catalog
    job_skills_found = set()
    for skill in SKILL_CATALOG:
        if _contains_skill(full_job_text, skill):
            job_skills_found.add(skill)

    # 2. Compare with user's skills (case-insensitive)
    user_skill_map = {s.lower(): s for s in user_skills}
    
    matched = []
    missing = []

    if job_skills_found:
        for skill in job_skills_found:
            if skill.lower() in user_skill_map:
                matched.append(skill)
            else:
                missing.append(skill)

        match_score = round((len(matched) / len(job_skills_found)) * 100, 1)
    else:
        # Fallback if job text doesn't contain catalog keywords:
        # check how many of user's skills are directly mentioned in job text
        for u_skill_lower, u_skill in user_skill_map.items():
            if _contains_skill(full_job_text, u_skill):
                matched.append(u_skill)

        if matched:
            match_score = min(95.0, round((len(matched) / max(len(user_skills), 1)) * 100, 1) + 20.0)
        else:
            match_score = 35.0  # Base general match

    # Ensure match score is strictly in [0.0, 100.0]
    match_score = max(0.0, min(100.0, match_score))
    return match_score, sorted(matched), sorted(missing)


def normalize_adzuna_job(
    raw_job: Dict[str, Any],
    country: str = 'in',
    user_skills: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Normalize raw Adzuna API job object into standardized CareerLens schema."""
    clean_title = clean_html(raw_job.get('title') or 'Untitled Job')
    clean_desc = clean_html(raw_job.get('description') or '')
    
    company_obj = raw_job.get('company') or {}
    company_name = clean_html(company_obj.get('display_name') if isinstance(company_obj, dict) else str(company_obj)) or 'Company not specified'

    location_obj = raw_job.get('location') or {}
    if isinstance(location_obj, dict):
        location_name = location_obj.get('display_name') or ', '.join(location_obj.get('area') or []) or 'Location not specified'
    else:
        location_name = str(location_obj) or 'Location not specified'

    salary_min = raw_job.get('salary_min')
    salary_max = raw_job.get('salary_max')
    formatted_sal = format_salary(salary_min, salary_max, country, raw_job.get('salary_is_predicted'))

    contract_time = raw_job.get('contract_time')
    contract_type = raw_job.get('contract_type')
    job_type = format_job_type(contract_time, contract_type)

    category_obj = raw_job.get('category') or {}
    category_label = category_obj.get('label') if isinstance(category_obj, dict) else None

    # Calculate CareerLens match score if user skills are available
    match_score, matched_skills, missing_skills = calculate_adzuna_job_match(
        clean_title,
        clean_desc,
        user_skills or [],
    )

    return {
        'id': str(raw_job.get('id') or ''),
        'title': clean_title,
        'company': company_name,
        'location': location_name,
        'description': clean_desc,
        'salary_min': float(salary_min) if salary_min is not None else None,
        'salary_max': float(salary_max) if salary_max is not None else None,
        'formatted_salary': formatted_sal,
        'salary_is_predicted': bool(raw_job.get('salary_is_predicted')),
        'job_type': job_type,
        'category': category_label,
        'redirect_url': raw_job.get('redirect_url') or '',
        'created': format_posting_date(raw_job.get('created')),
        'match_score': match_score,
        'matched_skills': matched_skills,
        'missing_skills': missing_skills,
        'source': 'adzuna',
    }


async def search_adzuna_jobs(
    query: Optional[str] = None,
    location: Optional[str] = None,
    page: int = 1,
    results_per_page: int = 10,
    salary_min: Optional[int] = None,
    salary_max: Optional[int] = None,
    country: Optional[str] = None,
    user_skills: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Search live jobs from Adzuna API and return normalized paginated results with CareerLens matching.
    """
    app_id = settings.adzuna_app_id
    app_key = settings.adzuna_app_key
    target_country = (country or settings.adzuna_country or 'in').strip().lower()

    if not app_id or not app_key:
        raise AdzunaAPIError(
            'Adzuna API credentials are not configured. Please set ADZUNA_APP_ID and ADZUNA_APP_KEY in backend/.env',
            status_code=503,
            detail='Adzuna API credentials missing. Please configure ADZUNA_APP_ID and ADZUNA_APP_KEY.',
        )

    safe_page = max(1, page)
    safe_results_per_page = max(1, min(50, results_per_page))

    url = f'https://api.adzuna.com/v1/api/jobs/{target_country}/search/{safe_page}'
    params: Dict[str, Any] = {
        'app_id': app_id,
        'app_key': app_key,
        'results_per_page': safe_results_per_page,
        'content-type': 'application/json',
    }

    if query and query.strip():
        params['what'] = query.strip()
    if location and location.strip():
        params['where'] = location.strip()
    if salary_min is not None and salary_min > 0:
        params['salary_min'] = salary_min
    if salary_max is not None and salary_max > 0:
        params['salary_max'] = salary_max

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)

            if response.status_code == 401 or response.status_code == 403:
                raise AdzunaAPIError(
                    'Invalid Adzuna API credentials. Please check your ADZUNA_APP_ID and ADZUNA_APP_KEY.',
                    status_code=502,
                    detail='Adzuna authentication failed. Please verify API keys in .env.',
                )
            elif response.status_code == 429:
                raise AdzunaAPIError(
                    'Adzuna API rate limit exceeded. Please try again in a few moments.',
                    status_code=429,
                    detail='Adzuna API rate limit exceeded.',
                )
            elif response.status_code != 200:
                raise AdzunaAPIError(
                    f'Adzuna API returned unexpected status code {response.status_code}',
                    status_code=502,
                    detail=f'Adzuna API error: {response.text[:200]}',
                )

            data = response.json()

    except httpx.TimeoutException as exc:
        raise AdzunaAPIError(
            'Adzuna API request timed out. Please try again.',
            status_code=504,
            detail='Connection to Adzuna timed out.',
        ) from exc
    except httpx.RequestError as exc:
        raise AdzunaAPIError(
            f'Failed to reach Adzuna API: {str(exc)}',
            status_code=502,
            detail='Network error contacting Adzuna API.',
        ) from exc

    raw_results = data.get('results') or []
    total_count = int(data.get('count') or len(raw_results))
    total_pages = max(1, (total_count + safe_results_per_page - 1) // safe_results_per_page)

    normalized_jobs = [
        normalize_adzuna_job(job, country=target_country, user_skills=user_skills)
        for job in raw_results
    ]

    # If user skills were provided, optionally sort current page by match_score descending
    if user_skills:
        normalized_jobs.sort(key=lambda j: j['match_score'], reverse=True)

    return {
        'results': normalized_jobs,
        'total_count': total_count,
        'page': safe_page,
        'results_per_page': safe_results_per_page,
        'total_pages': total_pages,
        'country': target_country,
        'personalized': bool(user_skills),
        'user_skills_used': user_skills or [],
    }
