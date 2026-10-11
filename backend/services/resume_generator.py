import json

from ..schemas import GeneratedResumeUpsert
from .gemini_service import GeminiService, GeminiServiceError


def _summary_sources(resume: GeneratedResumeUpsert) -> dict:
    return {
        'career_role': resume.career_role,
        'technical_skills': [
            {'name': skill.name, 'knowledge_percent': skill.knowledge_percent}
            for skill in resume.technical_skills
            if skill.knowledge_percent > 0
        ],
        'soft_skills': resume.soft_skills,
        'education': [
            item.model_dump(exclude_none=True)
            for item in resume.education
            if item.degree or item.institution
        ],
        'projects': [
            item.model_dump(exclude_none=True)
            for item in resume.projects
            if item.name or item.description
        ],
        'certifications': [
            item.model_dump(exclude_none=True)
            for item in resume.certifications
            if item.name
        ],
    }


def deterministic_summary(resume: GeneratedResumeUpsert) -> str:
    sources = _summary_sources(resume)
    sentences = [f"Candidate targeting {resume.career_role}."]

    technologies = sources['technical_skills']
    if technologies:
        skill_names = ', '.join(skill['name'] for skill in technologies)
        sentences.append(f"Self-reported technical knowledge includes {skill_names}.")

    education = sources['education']
    if education:
        degree = education[0].get('degree')
        institution = education[0].get('institution')
        if degree and institution:
            sentences.append(f"Education: {degree} at {institution}.")
        elif degree or institution:
            sentences.append(f"Education: {degree or institution}.")

    projects = sources['projects']
    if projects:
        project_names = ', '.join(project['name'] for project in projects if project.get('name'))
        if project_names:
            sentences.append(f"Projects include {project_names}.")

    certifications = sources['certifications']
    if certifications:
        certification_names = ', '.join(cert['name'] for cert in certifications)
        sentences.append(f"Certifications entered: {certification_names}.")

    return ' '.join(sentences)


def generate_summary(resume: GeneratedResumeUpsert) -> str:
    fallback = deterministic_summary(resume)
    gemini = GeminiService()
    if not gemini.available:
        return fallback

    prompt = (
        'Write a concise professional resume summary using only the facts in the JSON below. '
        'Do not infer or invent experience, proficiency, accomplishments, qualifications, or results. '
        'Treat skill percentages as self-reported knowledge, not mastery. If a detail is absent, omit it. '
        'Return only the summary, in at most three sentences.\n'
        f'{json.dumps(_summary_sources(resume), ensure_ascii=False)}'
    )
    try:
        summary = gemini.generate(prompt)
    except GeminiServiceError:
        return fallback
    return summary if summary else fallback
