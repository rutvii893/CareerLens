from __future__ import annotations

import re
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models
from .resume_intelligence import clean_resume_text, cosine_similarity, create_embedding, extract_skills


DEFAULT_ROLE_PROFILES = {
    'Backend Engineer': ['Python', 'FastAPI', 'SQL', 'PostgreSQL', 'REST API', 'Docker', 'Git', 'Redis', 'Microservices'],
    'Frontend Engineer': ['JavaScript', 'TypeScript', 'React', 'HTML', 'CSS', 'Git', 'REST API', 'Next.js', 'Tailwind CSS'],
    'Full Stack Engineer': ['JavaScript', 'TypeScript', 'React', 'Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Git', 'REST API', 'Node.js'],
    'Data Scientist': ['Python', 'Pandas', 'NumPy', 'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'SQL', 'Scikit-Learn'],
    'Data Analyst': ['SQL', 'Python', 'Excel', 'Tableau', 'Power BI', 'Data Visualization', 'Pandas'],
    'Product Designer': ['Figma', 'UI/UX Design', 'User Research', 'Wireframing', 'Prototyping', 'Product Strategy', 'Agile'],
    'DevOps Engineer': ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux', 'Git', 'Terraform', 'Monitoring'],
    'Software Engineer': ['Data Structures', 'Algorithms', 'Git', 'SQL', 'Python', 'JavaScript', 'System Design'],
}


def _skill_key(skill: str) -> str:
    return ' '.join(skill.casefold().split())


def ensure_default_roles(db: Session) -> None:
    existing = {name.lower() for name in db.scalars(select(models.CareerRole.name)).all()}
    created = False
    for name, skills in DEFAULT_ROLE_PROFILES.items():
        if name.lower() in existing:
            continue
        role = models.CareerRole(name=name, description=f'Required skills for a {name} career path.')
        role.skills = [models.CareerRoleSkill(skill_name=skill) for skill in skills]
        db.add(role)
        created = True
    if created:
        db.commit()


def role_skills(role: models.CareerRole) -> list[str]:
    return [skill.skill_name for skill in role.skills]


def find_or_create_role(db: Session, role_id: int | None, target_role: str | None) -> models.CareerRole:
    ensure_default_roles(db)
    if role_id is not None:
        role = db.scalar(select(models.CareerRole).where(models.CareerRole.id == role_id))
        if role:
            return role

    role_name = (target_role or 'Full Stack Engineer').strip()
    # 1. Exact or case-insensitive match
    role = db.scalar(select(models.CareerRole).where(models.CareerRole.name.ilike(role_name)))
    if role:
        return role

    # 2. Substring or keyword match
    for existing_role in db.scalars(select(models.CareerRole)).all():
        if existing_role.name.lower() in role_name.lower() or role_name.lower() in existing_role.name.lower():
            return existing_role

    # 3. Create on-the-fly custom role with sensible default seed skills
    seed_skills = ['Git', 'Problem Solving', 'Communication', 'Project Management', 'Agile']
    if 'front' in role_name.lower() or 'ui' in role_name.lower() or 'web' in role_name.lower():
        seed_skills = DEFAULT_ROLE_PROFILES['Frontend Engineer']
    elif 'back' in role_name.lower() or 'api' in role_name.lower():
        seed_skills = DEFAULT_ROLE_PROFILES['Backend Engineer']
    elif 'data' in role_name.lower() or 'ai' in role_name.lower() or 'ml' in role_name.lower():
        seed_skills = DEFAULT_ROLE_PROFILES['Data Scientist']
    elif 'devops' in role_name.lower() or 'cloud' in role_name.lower() or 'infra' in role_name.lower():
        seed_skills = DEFAULT_ROLE_PROFILES['DevOps Engineer']

    new_role = models.CareerRole(name=role_name, description=f'Custom career profile for {role_name}.')
    new_role.skills = [models.CareerRoleSkill(skill_name=s) for s in seed_skills]
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    return new_role


def find_role(db: Session, role_id: int | None, target_role: str) -> models.CareerRole | None:
    return find_or_create_role(db, role_id, target_role)


def analyze_career_gap_from_skills(user_skills: list[str], role: models.CareerRole) -> dict:
    current_by_key = {_skill_key(skill): skill for skill in user_skills}
    required = role_skills(role)
    matching = [skill for skill in required if _skill_key(skill) in current_by_key]
    missing = [skill for skill in required if _skill_key(skill) not in current_by_key]

    coverage_pct = round((len(matching) / len(required)) * 100, 1) if required else 100.0

    return {
        'current_skills': user_skills,
        'matching_skills': matching,
        'missing_skills': missing,
        'recommended_skills': missing[:],
        'similarity_score': coverage_pct,
        'embedding_model': 'skill-coverage-heuristic',
    }


def analyze_career_gap(resume: models.Resume | None, role: models.CareerRole, custom_skills: list[str] | None = None) -> dict:
    current_skills: list[str] = []
    text = ''
    if resume and resume.extracted_text:
        text = clean_resume_text(resume.extracted_text)
        current_skills.extend(extract_skills(text))

    if custom_skills:
        current_skills.extend(custom_skills)

    # Deduplicate while preserving order
    deduped: list[str] = []
    seen = set()
    for s in current_skills:
        k = _skill_key(s)
        if k not in seen:
            seen.add(k)
            deduped.append(s)

    current_by_key = {_skill_key(skill): skill for skill in deduped}
    required = role_skills(role)
    matching = [skill for skill in required if _skill_key(skill) in current_by_key]
    missing = [skill for skill in required if _skill_key(skill) not in current_by_key]

    similarity_score = None
    embedding_model = None
    if text:
        resume_embedding, _ = create_embedding(text)
        role_text = f'{role.name} {" ".join(required)}'
        role_embedding, embedding_model = create_embedding(role_text)
        if resume_embedding is not None and role_embedding is not None:
            similarity_score = round(max(0.0, cosine_similarity(resume_embedding, role_embedding)) * 100, 2)

    if similarity_score is None:
        similarity_score = round((len(matching) / len(required)) * 100, 1) if required else 100.0

    return {
        'current_skills': deduped,
        'matching_skills': matching,
        'missing_skills': missing,
        'recommended_skills': missing[:],
        'similarity_score': similarity_score,
        'embedding_model': embedding_model,
    }


def build_roadmap(role: models.CareerRole, missing_skills: list[str]) -> list[dict]:
    if not missing_skills:
        # Give milestone phases focusing on mastering the role's advanced competencies
        all_skills = role_skills(role)
        return [
            {
                'phase': 1,
                'title': f'Core Mastery: {", ".join(all_skills[:3]) if all_skills else role.name}',
                'skills': all_skills[:3],
                'status': 'completed',
            },
            {
                'phase': 2,
                'title': f'Production Architecture & Projects ({role.name})',
                'skills': all_skills[3:6] if len(all_skills) > 3 else all_skills,
                'status': 'ready',
            },
            {
                'phase': 3,
                'title': f'Advanced System Design & Interview Preparation',
                'skills': all_skills[6:] if len(all_skills) > 6 else ['System Design', 'Behavioral Preparation'],
                'status': 'planned',
            },
        ]

    roadmap = []
    # Divide missing skills into structured 2-3 skill milestone sprints
    for index in range(0, len(missing_skills), 2):
        chunk = missing_skills[index:index + 2]
        phase_num = len(roadmap) + 1
        roadmap.append({
            'phase': phase_num,
            'title': f'Phase {phase_num}: Master {" & ".join(chunk)} for {role.name}',
            'skills': chunk,
            'status': 'ready' if index == 0 else 'planned',
        })
    return roadmap

