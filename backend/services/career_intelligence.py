from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models
from .resume_intelligence import clean_resume_text, cosine_similarity, create_embedding, extract_skills


DEFAULT_ROLE_PROFILES = {
    'Backend Engineer': ['Python', 'FastAPI', 'SQL', 'PostgreSQL', 'REST API', 'Docker', 'Git'],
    'Frontend Engineer': ['JavaScript', 'TypeScript', 'React', 'HTML', 'CSS', 'Git', 'REST API'],
    'Product Designer': ['Figma', 'User Research', 'Wireframing', 'Product Strategy', 'Agile'],
}


def _skill_key(skill: str) -> str:
    return ' '.join(skill.casefold().split())


def ensure_default_roles(db: Session) -> None:
    existing = {name for name in db.scalars(select(models.CareerRole.name)).all()}
    created = False
    for name, skills in DEFAULT_ROLE_PROFILES.items():
        if name in existing:
            continue
        role = models.CareerRole(name=name, description=f'Required skills for a {name} career path.')
        role.skills = [models.CareerRoleSkill(skill_name=skill) for skill in skills]
        db.add(role)
        created = True
    if created:
        db.commit()


def role_skills(role: models.CareerRole) -> list[str]:
    return [skill.skill_name for skill in role.skills]


def find_role(db: Session, role_id: int | None, target_role: str) -> models.CareerRole | None:
    if role_id is not None:
        return db.scalar(select(models.CareerRole).where(models.CareerRole.id == role_id))
    return db.scalar(select(models.CareerRole).where(models.CareerRole.name.ilike(target_role.strip())))


def analyze_career_gap(resume: models.Resume, role: models.CareerRole) -> dict:
    text = clean_resume_text(resume.extracted_text or '')
    current_skills = extract_skills(text)
    current_by_key = {_skill_key(skill): skill for skill in current_skills}
    required = role_skills(role)
    missing = [skill for skill in required if _skill_key(skill) not in current_by_key]

    similarity_score = None
    resume_embedding, _ = create_embedding(text) if text else (None, None)
    role_text = f'{role.name} {" ".join(required)}'
    role_embedding, embedding_model = create_embedding(role_text) if text else (None, None)
    if resume_embedding is not None and role_embedding is not None:
        similarity_score = round(max(0.0, cosine_similarity(resume_embedding, role_embedding)) * 100, 2)

    return {
        'current_skills': current_skills,
        'missing_skills': missing,
        'recommended_skills': missing[:],
        'similarity_score': similarity_score,
        'embedding_model': embedding_model,
    }


def build_roadmap(role: models.CareerRole, missing_skills: list[str]) -> list[dict]:
    if not missing_skills:
        return [{'phase': 1, 'title': 'Strengthen your current profile', 'skills': [], 'status': 'ready'}]
    roadmap = []
    for index in range(0, len(missing_skills), 2):
        skills = missing_skills[index:index + 2]
        roadmap.append({
            'phase': len(roadmap) + 1,
            'title': f'{role.name} skill focus',
            'skills': skills,
            'status': 'up_next' if index == 0 else 'planned',
        })
    return roadmap
