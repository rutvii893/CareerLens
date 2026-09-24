from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import schemas
from ..dependencies import get_current_user, get_db
from .. import crud
from ..services.job_intelligence import JobIntelligenceError, analyze_job_description, compare_resume_to_job, get_owned_job

router = APIRouter(prefix='/matching', tags=['matching'])


def _owned_resume(db: Session, resume_id: int, user_id: int):
    resume = crud.get_resume(db, resume_id)
    if resume is None or resume.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Resume not found')
    return resume


@router.post('/jobs', response_model=schemas.JobRead, status_code=status.HTTP_201_CREATED)
def create_job(job_data: schemas.JobCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    try:
        intelligence = analyze_job_description(job_data.description)
    except JobIntelligenceError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    return crud.create_job(db, current_user.id, job_data, intelligence)


@router.post('/analyze', response_model=schemas.MatchingResponse)
def analyze_matching(request: schemas.MatchingRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    resume = _owned_resume(db, request.resume_id, current_user.id)
    if request.job_id is not None:
        job = get_owned_job(db, request.job_id, current_user.id)
        if job is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Job not found')
    elif request.job_description:
        try:
            intelligence = analyze_job_description(request.job_description)
        except JobIntelligenceError as exc:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
        job = crud.create_job(
            db,
            current_user.id,
            schemas.JobCreate(title='Custom job description', description=request.job_description),
            intelligence,
        )
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='job_description or job_id is required')

    try:
        result = compare_resume_to_job(resume, job)
    except JobIntelligenceError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    crud.save_job_match(db, resume.id, job.id, result)
    return schemas.MatchingResponse(**result)


@router.get('/jobs', response_model=list[schemas.JobMatchRead])
def get_jobs(resumeId: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    resume = _owned_resume(db, resumeId, current_user.id)
    results = []
    for job in crud.list_jobs(db, current_user.id):
        result = compare_resume_to_job(resume, job)
        crud.save_job_match(db, resume.id, job.id, result)
        results.append(schemas.JobMatchRead(job=job, **result))
    return results
