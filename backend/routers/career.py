from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..dependencies import get_current_user, get_db
from ..services.career_coach import answer_career_question
from ..services.career_intelligence import analyze_career_gap, build_roadmap, ensure_default_roles, find_role

router = APIRouter(prefix='/career', tags=['career'])


def _owned_resume(db: Session, resume_id: int | None, user_id: int):
    if resume_id is None:
        resume = db.scalar(
            models.Resume.__table__.select().where(models.Resume.user_id == user_id).order_by(models.Resume.uploaded_at.desc()).limit(1)
        )
        if resume is None:
            return None
        return db.get(models.Resume, resume.id)
    resume = crud.get_resume(db, resume_id)
    if resume is None or resume.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Resume not found')
    return resume


def _role(db: Session, request: schemas.CareerAnalyzeRequest):
    ensure_default_roles(db)
    role = find_role(db, request.role_id, request.target_role)
    if role is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Career role not found')
    return role


def _role_schema(role: models.CareerRole) -> schemas.CareerRoleRead:
    return schemas.CareerRoleRead(id=role.id, name=role.name, description=role.description, required_skills=[skill.skill_name for skill in role.skills])


@router.get('/roles', response_model=list[schemas.CareerRoleRead])
def list_roles(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    ensure_default_roles(db)
    return [_role_schema(role) for role in crud.list_career_roles(db)]


@router.post('/roles', response_model=schemas.CareerRoleRead, status_code=status.HTTP_201_CREATED)
def create_role(role_data: schemas.CareerRoleCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    try:
        role = crud.create_career_role(db, role_data)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Career role already exists') from exc
    return _role_schema(role)


@router.post('/coach/ask', response_model=schemas.CareerCoachResponse)
def ask_career_coach(request: schemas.CareerCoachRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    try:
        result = answer_career_question(db, current_user.id, request.question, request.resume_id, request.target_role)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return schemas.CareerCoachResponse(**result)


@router.post('/analyze', response_model=schemas.CareerAnalysisResponse)
def analyze_career(request: schemas.CareerAnalyzeRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    resume = _owned_resume(db, request.resume_id, current_user.id)
    if resume is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Resume not found')
    role = _role(db, request)
    result = analyze_career_gap(resume, role)
    return schemas.CareerAnalysisResponse(role=_role_schema(role), resume_id=resume.id, **result)


@router.post('/roadmap', response_model=schemas.CareerRoadmapResponse)
def create_roadmap(request: schemas.CareerAnalyzeRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    resume = _owned_resume(db, request.resume_id, current_user.id)
    if resume is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Resume not found')
    role = _role(db, request)
    analysis = analyze_career_gap(resume, role)
    roadmap = build_roadmap(role, analysis['missing_skills'])
    stored = crud.create_career_roadmap(
        db,
        current_user.id,
        role.name,
        resume.id,
        roadmap,
        role.id,
        analysis['missing_skills'],
        analysis['recommended_skills'],
    )
    return schemas.CareerRoadmapResponse(
        id=stored.id,
        role=_role_schema(role),
        resume_id=stored.resume_id,
        missing_skills=stored.missing_skills,
        recommended_skills=stored.recommended_skills,
        roadmap=stored.roadmap,
    )


@router.get('/roadmap', response_model=schemas.CareerRoadmapResponse)
def get_roadmap(resumeId: int | None = None, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    stored = crud.get_latest_career_roadmap(db, current_user.id, resumeId)
    if stored is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Career roadmap not found')
    role = db.get(models.CareerRole, stored.role_id) if stored.role_id else None
    return schemas.CareerRoadmapResponse(
        id=stored.id,
        role=_role_schema(role) if role else None,
        resume_id=stored.resume_id,
        missing_skills=stored.missing_skills,
        recommended_skills=stored.recommended_skills,
        roadmap=stored.roadmap,
    )
