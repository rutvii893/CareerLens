from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..dependencies import get_current_user, get_db
from ..services.resume_intelligence import SKILL_CATALOG

router = APIRouter(prefix='/users', tags=['users'])

SKILL_CATEGORIES = {
    'Programming Languages': ['Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'C#', 'SQL', 'HTML', 'CSS', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin'],
    'Frameworks & Libraries': ['React', 'Angular', 'Vue', 'Node.js', 'Django', 'FastAPI', 'Flask', 'Spring', 'Express', 'Next.js', 'Tailwind', 'Bootstrap', 'PyTorch', 'TensorFlow', 'Pandas', 'NumPy'],
    'Cloud & Databases': ['PostgreSQL', 'MySQL', 'MongoDB', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Redis', 'Firebase'],
    'Tools & Methodologies': ['Git', 'REST API', 'GraphQL', 'CI/CD', 'Linux', 'Agile', 'Scrum', 'Figma', 'Wireframing', 'User Research', 'Product Strategy', 'Project Management', 'Data Analysis', 'Machine Learning', 'Deep Learning'],
}


@router.get('/me', response_model=schemas.UserRead)
def read_me(current_user: schemas.UserRead = Depends(get_current_user), db: Session = Depends(get_db)):
    user_db = crud.get_user(db, current_user.id)
    if not user_db:
        raise HTTPException(status_code=404, detail='User not found')
    return user_db


@router.put('/me', response_model=schemas.UserRead)
def update_me(updates: schemas.UserUpdate, db: Session = Depends(get_db), current_user: schemas.UserRead = Depends(get_current_user)):
    user_db = crud.get_user(db, current_user.id)
    if not user_db:
        raise HTTPException(status_code=404, detail='User not found')

    if updates.email and updates.email != user_db.email:
        existing = crud.get_user_by_email(db, updates.email)
        if existing and existing.id != user_db.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email already in use')

    updated = crud.update_user(db, user_db, updates)
    return updated


@router.get('/me/dashboard', response_model=schemas.DashboardMetrics)
def get_dashboard(db: Session = Depends(get_db), current_user: schemas.UserRead = Depends(get_current_user)):
    return crud.get_dashboard_metrics(db, current_user.id)


@router.get('/me/skills', response_model=schemas.SkillsResponse)
def get_user_skills(db: Session = Depends(get_db), current_user: schemas.UserRead = Depends(get_current_user)):
    user_db = crud.get_user(db, current_user.id)
    latest_ats = crud.get_latest_ats_result(db, current_user.id)
    
    extracted = list(latest_ats.extracted_skills or []) if latest_ats else []
    custom = list(user_db.custom_skills or []) if user_db else []
    all_skills = list(dict.fromkeys(extracted + custom))

    # Categorize skills
    categorized = {cat: [] for cat in SKILL_CATEGORIES}
    categorized['Other'] = []

    for skill in all_skills:
        placed = False
        for cat, known_list in SKILL_CATEGORIES.items():
            if any(k.lower() == skill.lower() for k in known_list):
                categorized[cat].append(skill)
                placed = True
                break
        if not placed:
            categorized['Other'].append(skill)

    # Clean up empty categories
    categorized = {k: v for k, v in categorized.items() if v}

    # Role matching against user's target role or latest roadmap
    target_role = user_db.target_role if user_db and user_db.target_role else None
    role_matching = []
    role_missing = []
    role_readiness = 0.0

    roadmap = crud.get_latest_career_roadmap(db, current_user.id)
    if roadmap and roadmap.target_role:
        target_role = roadmap.target_role
        role_missing = list(roadmap.missing_skills or [])
        # matching skills are the intersection
        role_matching = [s for s in all_skills if s not in role_missing]
        total_req = len(role_matching) + len(role_missing)
        role_readiness = round((len(role_matching) / total_req * 100), 1) if total_req > 0 else 0.0

    return schemas.SkillsResponse(
        extracted_skills=extracted,
        custom_skills=custom,
        all_skills=all_skills,
        categorized_skills=categorized,
        target_role=target_role,
        role_matching_skills=role_matching,
        role_missing_skills=role_missing,
        role_readiness_score=role_readiness,
    )


@router.post('/me/skills', response_model=schemas.SkillsResponse)
def add_custom_skill(skill_in: schemas.CustomSkillCreate, db: Session = Depends(get_db), current_user: schemas.UserRead = Depends(get_current_user)):
    if not skill_in.skill_name.strip():
        raise HTTPException(status_code=400, detail='Skill name cannot be empty')
    crud.add_user_custom_skill(db, current_user.id, skill_in.skill_name.strip())
    return get_user_skills(db, current_user)


@router.delete('/me/skills/{skill_name}', response_model=schemas.SkillsResponse)
def delete_custom_skill(skill_name: str, db: Session = Depends(get_db), current_user: schemas.UserRead = Depends(get_current_user)):
    crud.remove_user_custom_skill(db, current_user.id, skill_name)
    return get_user_skills(db, current_user)
