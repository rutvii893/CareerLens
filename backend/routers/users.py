from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from .. import crud, models, schemas
from ..dependencies import get_current_user, get_db
from ..services.career_intelligence import DEFAULT_ROLE_PROFILES

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


@router.put('/me/target-goal', response_model=schemas.UserRead)
def update_target_goal(goal_in: schemas.TargetGoalUpdateRequest, db: Session = Depends(get_db), current_user: schemas.UserRead = Depends(get_current_user)):
    user = crud.update_user_target_goal(db, current_user.id, goal_in.target_role, goal_in.target_score)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    return user


@router.get('/me/skills', response_model=schemas.SkillsResponse)
def get_user_skills(db: Session = Depends(get_db), current_user: schemas.UserRead = Depends(get_current_user)):
    user_db = crud.get_user(db, current_user.id)
    latest_ats = crud.get_latest_ats_result(db, current_user.id)
    
    extracted = list(latest_ats.extracted_skills or []) if latest_ats else []
    custom = list(user_db.custom_skills or []) if user_db else []
    all_skills = list(dict.fromkeys(extracted + custom))

    prefs = dict(user_db.preferences or {}) if user_db else {}
    target_role = user_db.target_role if (user_db and user_db.target_role) else 'Full Stack Engineer'
    target_score = float(prefs.get('target_score', 80.0))
    skill_assessments = dict(prefs.get('skill_assessments') or {})

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

    categorized = {k: v for k, v in categorized.items() if v}

    # Role required skills
    role_obj = db.scalar(select(models.CareerRole).where(models.CareerRole.name.ilike(target_role.strip())))
    if role_obj and role_obj.skills:
        req_skills = [s.skill_name for s in role_obj.skills]
    else:
        req_skills = DEFAULT_ROLE_PROFILES.get(target_role, ['Python', 'JavaScript', 'React', 'SQL', 'Git', 'REST API', 'Docker'])

    # Build assessment items and calculate gap
    assessments = []
    skills_to_improve = []
    skills_meeting = []
    individual_gaps = []

    all_evaluated_skills = list(dict.fromkeys(req_skills + all_skills))
    extracted_lower = {s.lower() for s in extracted}
    custom_lower = {s.lower() for s in custom}

    for skill in all_evaluated_skills:
        s_lower = skill.lower()
        if skill in skill_assessments:
            c_score = float(skill_assessments[skill].get('current_score', 0.0))
            t_score = float(skill_assessments[skill].get('target_score', target_score))
        elif s_lower in extracted_lower:
            c_score = 80.0
            t_score = target_score
        elif s_lower in custom_lower:
            c_score = 70.0
            t_score = target_score
        else:
            c_score = 0.0
            t_score = target_score

        gap_pct = round(max(0.0, t_score - c_score) / t_score * 100.0, 1) if t_score > 0 else 0.0
        
        # Only required skills count toward overall role gap
        if skill in req_skills:
            individual_gaps.append(gap_pct)

        status_label = 'meets_target' if gap_pct == 0.0 else ('missing' if c_score == 0 else 'needs_improvement')
        
        # Category lookup
        skill_cat = 'Other'
        for cat, k_list in SKILL_CATEGORIES.items():
            if any(k.lower() == s_lower for k in k_list):
                skill_cat = cat
                break

        item = schemas.SkillAssessmentItem(
            name=skill,
            category=skill_cat,
            current_score=c_score,
            target_score=t_score,
            gap_percentage=gap_pct,
            status=status_label,
            source='resume' if s_lower in extracted_lower else ('custom' if s_lower in custom_lower else 'missing')
        )
        assessments.append(item)
        if status_label == 'meets_target':
            skills_meeting.append(item)
        else:
            skills_to_improve.append(item)

    overall_gap = round(sum(individual_gaps) / len(individual_gaps), 1) if individual_gaps else 0.0
    role_matching = [s for s in req_skills if s.lower() in extracted_lower or s.lower() in custom_lower]
    role_missing = [s for s in req_skills if s not in role_matching]
    role_readiness = round((len(role_matching) / len(req_skills) * 100), 1) if req_skills else 0.0

    return schemas.SkillsResponse(
        extracted_skills=extracted,
        custom_skills=custom,
        all_skills=all_skills,
        categorized_skills=categorized,
        target_role=target_role,
        target_score=target_score,
        overall_skill_gap_percentage=overall_gap,
        skills_to_improve=skills_to_improve,
        skills_meeting_target=skills_meeting,
        assessments=assessments,
        role_matching_skills=role_matching,
        role_missing_skills=role_missing,
        role_readiness_score=role_readiness,
    )


@router.put('/me/skills/assessment', response_model=schemas.SkillsResponse)
def update_skill_assessment(
    assessment_in: schemas.SkillAssessmentUpdateRequest,
    db: Session = Depends(get_db),
    current_user: schemas.UserRead = Depends(get_current_user),
):
    crud.update_user_skill_assessment(
        db,
        current_user.id,
        assessment_in.skill_name.strip(),
        assessment_in.current_score,
        assessment_in.target_score or 80.0,
    )
    return get_user_skills(db, current_user)


@router.post('/me/skills', response_model=schemas.SkillsResponse)
def add_custom_skill(skill_in: schemas.CustomSkillCreate, db: Session = Depends(get_db), current_user: schemas.UserRead = Depends(get_current_user)):
    if not skill_in.skill_name.strip():
        raise HTTPException(status_code=400, detail='Skill name cannot be empty')
    crud.add_user_custom_skill(db, current_user.id, skill_in.skill_name.strip())
    if skill_in.current_score is not None:
        crud.update_user_skill_assessment(db, current_user.id, skill_in.skill_name.strip(), skill_in.current_score)
    return get_user_skills(db, current_user)


@router.delete('/me/skills/{skill_name}', response_model=schemas.SkillsResponse)
def delete_custom_skill(skill_name: str, db: Session = Depends(get_db), current_user: schemas.UserRead = Depends(get_current_user)):
    crud.remove_user_custom_skill(db, current_user.id, skill_name)
    return get_user_skills(db, current_user)
