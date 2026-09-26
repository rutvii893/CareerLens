from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..dependencies import get_current_user, get_db, get_optional_current_user
from ..services.adzuna_service import AdzunaAPIError, search_adzuna_jobs

router = APIRouter(prefix='/jobs', tags=['jobs'])


@router.get('/search', response_model=schemas.AdzunaJobSearchResponse)
async def search_jobs(
    query: Optional[str] = Query(None, description='Job title, skill keywords, or company name'),
    location: Optional[str] = Query(None, description='City, state, or location'),
    page: int = Query(1, ge=1, description='Page number'),
    results_per_page: int = Query(10, ge=1, le=50, description='Number of job items per page'),
    salary_min: Optional[int] = Query(None, ge=0, description='Minimum annual salary filter'),
    salary_max: Optional[int] = Query(None, ge=0, description='Maximum annual salary filter'),
    country: Optional[str] = Query(None, description='Two-letter country code (e.g. in, us, gb)'),
    personalized: bool = Query(True, description='Enable personalized CareerLens skill matching against resume'),
    resume_id: Optional[int] = Query(None, description='Optional specific resume ID to match against'),
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_current_user),
):
    """
    Search real live job listings via the official Adzuna Job Search API.
    Optionally computes personalized CareerLens match scores against the user's analyzed resume skills.
    """
    user_skills = []

    if personalized and current_user:
        if resume_id is not None:
            resume = crud.get_resume(db, resume_id)
            if resume and resume.user_id == current_user.id and resume.ats_results:
                ats_result = resume.ats_results[0] if resume.ats_results else None
                if ats_result:
                    user_skills = list(ats_result.extracted_skills or [])
        else:
            latest_ats = crud.get_latest_ats_result(db, current_user.id)
            if latest_ats:
                user_skills = list(latest_ats.extracted_skills or [])
        
        # Also include user's custom skills
        user_db = crud.get_user(db, current_user.id)
        if user_db and user_db.custom_skills:
            user_skills = list(dict.fromkeys(user_skills + list(user_db.custom_skills)))

    try:
        results = await search_adzuna_jobs(
            query=query,
            location=location,
            page=page,
            results_per_page=results_per_page,
            salary_min=salary_min,
            salary_max=salary_max,
            country=country,
            user_skills=user_skills if user_skills else None,
        )
        return schemas.AdzunaJobSearchResponse(**results)
    except AdzunaAPIError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.detail or exc.message,
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'An unexpected error occurred while searching jobs: {str(exc)}',
        ) from exc


@router.post('/save', response_model=schemas.SavedJobRead, status_code=status.HTTP_201_CREATED)
def save_job(job_in: schemas.SavedJobCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Save an Adzuna job or custom job listing to user's saved jobs and application tracker."""
    return crud.create_saved_job(db, current_user.id, job_in)


@router.get('/saved', response_model=list[schemas.SavedJobRead])
def list_saved_jobs(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """List all saved jobs and tracked applications for the authenticated user."""
    return crud.get_user_saved_jobs(db, current_user.id)


@router.patch('/saved/{application_id}/status', response_model=schemas.SavedJobRead)
def update_saved_job_status(
    application_id: int,
    status_update: schemas.ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Update job application status (saved, applied, interviewing, offer, rejected)."""
    app = crud.get_user_application(db, application_id, current_user.id)
    if not app:
        raise HTTPException(status_code=404, detail='Saved job or application not found')
    return crud.update_application_status(db, app, status_update)


@router.delete('/saved/{application_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_saved_job(
    application_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Delete a saved job or tracked application."""
    deleted = crud.delete_user_application(db, application_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail='Saved job not found')
    return None
