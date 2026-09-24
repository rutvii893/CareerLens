from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import crud, models
from .career_intelligence import analyze_career_gap, find_role, role_skills
from .gemini_service import GeminiService, GeminiServiceError
from .resume_intelligence import clean_resume_text, extract_skills


def _latest_resume(db: Session, user_id: int) -> models.Resume | None:
    return db.scalar(
        select(models.Resume)
        .where(models.Resume.user_id == user_id)
        .order_by(models.Resume.uploaded_at.desc())
    )


def build_context(db: Session, user_id: int, resume_id: int | None, target_role: str | None) -> dict:
    resume = crud.get_resume(db, resume_id) if resume_id is not None else _latest_resume(db, user_id)
    if resume is not None and resume.user_id != user_id:
        raise ValueError('Resume not found')

    role = None
    gap = {'current_skills': [], 'missing_skills': [], 'recommended_skills': []}
    if target_role:
        role = find_role(db, None, target_role)
    if resume is not None:
        current_skills = extract_skills(clean_resume_text(resume.extracted_text or ''))
        gap['current_skills'] = current_skills
        if role:
            gap = analyze_career_gap(resume, role)

    roadmap = crud.get_latest_career_roadmap(db, user_id, resume.id if resume else None)
    return {
        'resume': resume,
        'role': role,
        'current_skills': gap['current_skills'],
        'missing_skills': gap['missing_skills'],
        'recommended_skills': gap['recommended_skills'],
        'roadmap': roadmap.roadmap if roadmap else [],
        'required_skills': role_skills(role) if role else [],
    }


def _fallback_answer(question: str, context: dict) -> str:
    role = context['role'].name if context['role'] else 'your selected direction'
    missing = ', '.join(context['missing_skills']) or 'No role-specific skill gaps are recorded.'
    current = ', '.join(context['current_skills']) or 'No catalogued resume skills are recorded.'
    return (
        f'Based on the available CareerLens data, your current skills are: {current}. '
        f'For {role}, the recorded skill gaps are: {missing} '
        f'Your question was: "{question.strip()}". Configure GEMINI_API_KEY for a generated career-coaching response.'
    )


def answer_career_question(db: Session, user_id: int, question: str, resume_id: int | None, target_role: str | None) -> dict:
    context = build_context(db, user_id, resume_id, target_role)
    prompt = (
        'You are a career coach. Use only the supplied CareerLens context; do not invent user facts. '
        'Answer the question with practical, concise guidance.\n\n'
        f'Question: {question.strip()}\n'
        f'Target role: {context["role"].name if context["role"] else "not provided"}\n'
        f'Current resume skills: {context["current_skills"]}\n'
        f'Missing role skills: {context["missing_skills"]}\n'
        f'Recorded roadmap: {context["roadmap"]}'
    )
    provider = 'deterministic_fallback'
    try:
        answer = GeminiService().generate(prompt)
        provider = 'gemini'
    except GeminiServiceError:
        answer = _fallback_answer(question, context)

    return {
        'answer': answer,
        'provider': provider,
        'target_role': context['role'].name if context['role'] else target_role,
        'resume_id': context['resume'].id if context['resume'] else None,
        'current_skills': context['current_skills'],
        'missing_skills': context['missing_skills'],
        'roadmap': context['roadmap'],
    }
