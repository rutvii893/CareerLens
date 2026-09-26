from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..dependencies import get_current_user, get_db
from ..services.career_coach import answer_career_question
from ..services.career_intelligence import analyze_career_gap, build_roadmap, ensure_default_roles, find_or_create_role

router = APIRouter(prefix='/career', tags=['career'])


def _owned_resume(db: Session, resume_id: int | None, user_id: int) -> models.Resume | None:
    if resume_id is None:
        resume = db.scalar(
            models.Resume.__table__.select().where(models.Resume.user_id == user_id).order_by(models.Resume.uploaded_at.desc()).limit(1)
        )
        if resume is None:
            return None
        return db.get(models.Resume, resume.id)
    resume = crud.get_resume(db, resume_id)
    if resume is None or resume.user_id != user_id:
        # Fallback to latest resume if provided id doesn't match
        return db.scalar(
            models.Resume.__table__.select().where(models.Resume.user_id == user_id).order_by(models.Resume.uploaded_at.desc()).limit(1)
        )
    return resume


def _role(db: Session, request: schemas.CareerAnalyzeRequest) -> models.CareerRole:
    return find_or_create_role(db, request.role_id, request.target_role)


def _role_schema(role: models.CareerRole | None) -> schemas.CareerRoleRead | None:
    if not role:
        return None
    return schemas.CareerRoleRead(id=role.id, name=role.name, description=role.description, required_skills=[skill.skill_name for skill in role.skills])


def _format_roadmap_response(stored: models.CareerRoadmap, db: Session) -> schemas.CareerRoadmapResponse:
    role = db.get(models.CareerRole, stored.role_id) if stored.role_id else None
    items = list(stored.roadmap or [])
    completed = sum(1 for item in items if item.get('status') in {'completed', 'done'})
    total = len(items)
    pct = round((completed / total * 100), 1) if total > 0 else 0.0
    return schemas.CareerRoadmapResponse(
        id=stored.id,
        role=_role_schema(role),
        target_role=stored.target_role,
        resume_id=stored.resume_id,
        missing_skills=list(stored.missing_skills or []),
        recommended_skills=list(stored.recommended_skills or []),
        roadmap=items,
        completed_phases=completed,
        total_phases=total,
        progress_percentage=pct,
        status=stored.status,
    )


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
    user_db = crud.get_user(db, current_user.id)
    custom_skills = list(user_db.custom_skills or []) if user_db else []
    role = _role(db, request)
    result = analyze_career_gap(resume, role, custom_skills)
    return schemas.CareerAnalysisResponse(role=_role_schema(role), resume_id=resume.id if resume else None, **result)


@router.post('/roadmap', response_model=schemas.CareerRoadmapResponse)
def create_roadmap(request: schemas.CareerAnalyzeRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    resume = _owned_resume(db, request.resume_id, current_user.id)
    user_db = crud.get_user(db, current_user.id)
    custom_skills = list(user_db.custom_skills or []) if user_db else []
    
    role = _role(db, request)
    analysis = analyze_career_gap(resume, role, custom_skills)
    roadmap_items = build_roadmap(role, analysis['missing_skills'])
    stored = crud.create_career_roadmap(
        db,
        current_user.id,
        role.name,
        resume.id if resume else None,
        roadmap_items,
        role.id,
        analysis['missing_skills'],
        analysis['recommended_skills'],
    )
    return _format_roadmap_response(stored, db)


@router.get('/roadmap', response_model=schemas.CareerRoadmapResponse)
def get_roadmap(resumeId: int | None = None, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    stored = crud.get_latest_career_roadmap(db, current_user.id, resumeId)
    if stored is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Career roadmap not found. Generate one for your target role.')
    return _format_roadmap_response(stored, db)


@router.patch('/roadmap/{roadmap_id}/phase/{phase_idx}', response_model=schemas.CareerRoadmapResponse)
def update_roadmap_phase(
    roadmap_id: int,
    phase_idx: int,
    phase_update: schemas.RoadmapPhaseUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Toggle or update completion status for a specific roadmap phase milestone."""
    updated = crud.update_career_roadmap_phase(db, roadmap_id, current_user.id, phase_idx, phase_update.status)
    if not updated:
        raise HTTPException(status_code=404, detail='Roadmap or phase not found')
    return _format_roadmap_response(updated, db)


@router.get('/roadmaps', response_model=list[schemas.CareerRoadmapResponse])
def list_roadmaps(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    roadmaps = crud.list_user_roadmaps(db, current_user.id)
    return [_format_roadmap_response(r, db) for r in roadmaps]

