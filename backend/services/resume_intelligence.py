from __future__ import annotations

import math
import re
from pathlib import Path
from typing import Iterable, Optional


_EMBEDDING_MODEL = None


class ResumeIntelligenceError(Exception):
    """Raised when a supported resume cannot be extracted or analyzed."""


SECTION_ALIASES = {
    'summary': ('summary', 'profile', 'objective', 'about me'),
    'experience': ('experience', 'work experience', 'employment', 'professional experience'),
    'education': ('education', 'academic background'),
    'skills': ('skills', 'technical skills', 'core competencies', 'technologies'),
    'projects': ('projects', 'selected projects', 'personal projects'),
    'certifications': ('certifications', 'certificates', 'licenses'),
}

SKILL_CATALOG = (
    'Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'C#', 'SQL', 'HTML', 'CSS',
    'React', 'Angular', 'Vue', 'Node.js', 'Django', 'FastAPI', 'Flask', 'Spring',
    'PostgreSQL', 'MySQL', 'MongoDB', 'AWS', 'Azure', 'Docker', 'Kubernetes', 'Git',
    'REST API', 'GraphQL', 'Machine Learning', 'Deep Learning', 'Data Analysis',
    'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Figma', 'User Research', 'Wireframing',
    'Product Strategy', 'Agile', 'Scrum', 'Project Management',
)

EXPECTED_SECTIONS = ('summary', 'experience', 'education', 'skills', 'projects')


def clean_resume_text(text: str) -> str:
    text = text.replace('\x00', ' ')
    text = re.sub(r'[^\S\r\n]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return '\n'.join(line.strip() for line in text.splitlines()).strip()


def extract_text_from_file(file_path: str, content_type: Optional[str] = None) -> str:
    path = Path(file_path)
    extension = path.suffix.lower()
    if content_type == 'application/pdf' or extension == '.pdf':
        try:
            from pypdf import PdfReader
        except ImportError as exc:
            raise ResumeIntelligenceError('PDF extraction requires pypdf') from exc
        text = '\n'.join(page.extract_text() or '' for page in PdfReader(str(path)).pages)
    elif content_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' or extension == '.docx':
        try:
            from docx import Document
        except ImportError as exc:
            raise ResumeIntelligenceError('DOCX extraction requires python-docx') from exc
        text = '\n'.join(paragraph.text for paragraph in Document(str(path)).paragraphs)
    else:
        raise ResumeIntelligenceError('Unsupported resume format')
    cleaned = clean_resume_text(text)
    if not cleaned:
        raise ResumeIntelligenceError('No readable text found in resume')
    return cleaned


def _contains_skill(text: str, skill: str) -> bool:
    pattern = re.escape(skill).replace(r'\ ', r'\s+')
    if skill in {'C++', 'C#'}:
        return bool(re.search(rf'(?<!\w){pattern}(?!\w)', text, flags=re.IGNORECASE))
    return bool(re.search(rf'(?<!\w){pattern}(?!\w)', text, flags=re.IGNORECASE))


def extract_skills(text: str, catalog: Iterable[str] = SKILL_CATALOG) -> list[str]:
    return [skill for skill in catalog if _contains_skill(text, skill)]


def analyze_sections(text: str) -> dict[str, dict[str, int | bool]]:
    lowered = text.lower()
    sections = {}
    for section, aliases in SECTION_ALIASES.items():
        present = any(re.search(rf'(?m)^\s*{re.escape(alias)}\s*:?[ \t]*$', lowered) for alias in aliases)
        if not present:
            present = any(re.search(rf'(?m)^\s*{re.escape(alias)}\b', lowered) for alias in aliases)
        sections[section] = {'present': present, 'score': 100 if present else 0}
    return sections


def analyze_keywords(text: str, sections: dict) -> tuple[float, list[str]]:
    expected_keywords = list(EXPECTED_SECTIONS)
    present = [keyword for keyword in expected_keywords if sections[keyword]['present']]
    missing = [keyword.title() for keyword in expected_keywords if keyword not in present]
    return round((len(present) / len(expected_keywords)) * 100, 2), missing


def cosine_similarity(first: Iterable[float], second: Iterable[float]) -> float:
    left, right = list(first), list(second)
    if len(left) != len(right) or not left:
        return 0.0
    denominator = math.sqrt(sum(value * value for value in left)) * math.sqrt(sum(value * value for value in right))
    return round(sum(a * b for a, b in zip(left, right)) / denominator, 6) if denominator else 0.0


def create_embedding(text: str) -> tuple[list[float] | None, str | None]:
    global _EMBEDDING_MODEL
    try:
        from sentence_transformers import SentenceTransformer
        model_name = 'all-MiniLM-L6-v2'
        if _EMBEDDING_MODEL is None:
            _EMBEDDING_MODEL = SentenceTransformer(model_name)
        return _EMBEDDING_MODEL.encode(text, normalize_embeddings=True).tolist(), model_name
    except Exception:
        return None, None


def analyze_resume_text(text: str, target_skills: Optional[Iterable[str]] = None) -> dict:
    cleaned = clean_resume_text(text)
    if not cleaned:
        raise ResumeIntelligenceError('No readable text found in resume')
    sections = analyze_sections(cleaned)
    keyword_score, missing_keywords = analyze_keywords(cleaned, sections)
    skills = extract_skills(cleaned)
    target = list(target_skills or [])
    missing_skills = [skill for skill in target if not _contains_skill(cleaned, skill)]
    recommended_skills = missing_skills[:]
    recommendations = []
    for section in EXPECTED_SECTIONS:
        if not sections[section]['present']:
            recommendations.append(f'Add a clear {section} section to improve resume scanability.')
    if len(skills) < 3:
        recommendations.append('Add more role-relevant technical or professional skills using the exact terms used in job descriptions.')
    if len(cleaned.split()) < 120:
        recommendations.append('Add measurable outcomes and context so your experience is easier to evaluate.')
    recommendations.extend(f'Consider highlighting experience with {skill}.' for skill in recommended_skills)
    section_score = sum(int(sections[name]['score']) for name in EXPECTED_SECTIONS) / len(EXPECTED_SECTIONS)
    content_score = min(100.0, max(0.0, len(cleaned.split()) / 5))
    overall_score = round((keyword_score * 0.4) + (section_score * 0.35) + (content_score * 0.25), 2)
    embedding, embedding_model = create_embedding(cleaned)
    return {
        'extracted_text': cleaned,
        'overall_score': overall_score,
        'keyword_score': keyword_score,
        'extracted_skills': skills,
        'missing_keywords': missing_keywords,
        'missing_skills': missing_skills,
        'recommended_skills': recommended_skills,
        'recommendations': recommendations,
        'section_analysis': sections,
        'embedding': embedding,
        'embedding_model': embedding_model,
    }


def analyze_resume_file(file_path: str, content_type: Optional[str] = None, target_skills: Optional[Iterable[str]] = None) -> dict:
    text = extract_text_from_file(file_path, content_type)
    return analyze_resume_text(text, target_skills=target_skills)
