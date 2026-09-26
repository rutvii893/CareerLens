from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import crud, models
from .career_intelligence import analyze_career_gap, find_or_create_role, role_skills
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
        resume = _latest_resume(db, user_id)

    user_db = crud.get_user(db, user_id)
    custom_skills = list(user_db.custom_skills or []) if user_db else []
    target_role_name = target_role or (user_db.target_role if user_db else 'Full Stack Engineer')

    role = find_or_create_role(db, None, target_role_name)
    gap = analyze_career_gap(resume, role, custom_skills)
    roadmap = crud.get_latest_career_roadmap(db, user_id, resume.id if resume else None)

    return {
        'resume': resume,
        'role': role,
        'current_skills': gap['current_skills'],
        'matching_skills': gap['matching_skills'],
        'missing_skills': gap['missing_skills'],
        'recommended_skills': gap['recommended_skills'],
        'roadmap': roadmap.roadmap if roadmap else [],
        'required_skills': role_skills(role) if role else [],
        'target_role': role.name,
    }


def _fallback_answer(question: str, context: dict) -> str:
    role = context['target_role']
    missing = ', '.join(context['missing_skills']) if context['missing_skills'] else 'None detected! You meet the core required skills.'
    current = ', '.join(context['current_skills']) if context['current_skills'] else 'No catalogued skills yet. Upload a resume or add skills in My Skills.'
    
    # Generate structured, high-value career coach guidance
    q_lower = question.lower()
    advice_lines = []

    if 'skill' in q_lower or 'learn' in q_lower or 'gap' in q_lower:
        advice_lines.append(f"### Priority Skill Focus for {role}:")
        if context['missing_skills']:
            for s in context['missing_skills'][:3]:
                advice_lines.append(f"- **{s}**: Focus on hands-on practical projects and documentation to bridge this gap.")
        else:
            advice_lines.append("- You already have all primary core skills catalogued! Deepen your knowledge in system architecture and performance optimization.")

    elif 'resume' in q_lower or 'ats' in q_lower:
        advice_lines.append("### ATS Resume Optimization Advice:")
        advice_lines.append(f"- Ensure keywords like **{', '.join(context['required_skills'][:5])}** are explicitly mentioned in your project descriptions.")
        advice_lines.append("- Use standard bullet points formatted with action verbs, quantifiable metrics, and impact (e.g., 'Improved latency by 35% using Redis caching').")

    elif 'project' in q_lower or 'portfolio' in q_lower:
        advice_lines.append(f"### High-Impact Project Ideas for {role}:")
        advice_lines.append(f"- Build a full-stack, production-ready platform demonstrating **{', '.join((context['missing_skills'] + context['current_skills'])[:3])}**.")
        advice_lines.append("- Implement CI/CD automated testing and deploy with live URL, documentation, and database schema diagrams.")

    elif 'interview' in q_lower:
        advice_lines.append(f"### Interview Preparation Strategy for {role}:")
        advice_lines.append("- Practice both technical question breakdowns (algorithms/system design) and behavioral STAR-format stories.")
        advice_lines.append(f"- Be prepared to explain architectural tradeoffs involving **{', '.join(context['required_skills'][:3])}**.")

    else:
        advice_lines.append(f"### Career Guidance for {role}:")
        advice_lines.append(f"- **Current Strengths**: {current}")
        advice_lines.append(f"- **Next Priority Milestones**: {missing}")
        advice_lines.append("- Continue updating your roadmap progress and practicing mock interviews in CareerLens to track your readiness score.")

    return "\n".join(advice_lines)


def answer_career_question(db: Session, user_id: int, question: str, resume_id: int | None, target_role: str | None) -> dict:
    context = build_context(db, user_id, resume_id, target_role)
    prompt = (
        'You are an expert career coach in CareerLens. '
        'Provide actionable, encouraging, and structured career guidance using the user\'s actual context.\n\n'
        f'Question: {question.strip()}\n'
        f'Target role: {context["target_role"]}\n'
        f'Current catalogued skills: {context["current_skills"]}\n'
        f'Missing role skills (gaps): {context["missing_skills"]}\n'
        f'Matching skills: {context["matching_skills"]}\n'
        f'Required role skills: {context["required_skills"]}\n'
        f'Active roadmap milestones: {context["roadmap"]}'
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
        'target_role': context['target_role'],
        'resume_id': context['resume'].id if context['resume'] else None,
        'current_skills': context['current_skills'],
        'missing_skills': context['missing_skills'],
        'roadmap': context['roadmap'],
    }

