from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import schemas
from ..dependencies import get_current_user, get_db

router = APIRouter(prefix='/matching', tags=['matching'])


@router.post('/analyze', response_model=schemas.MatchingResponse)
def analyze_matching(request: schemas.MatchingRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if not request.job_description and not request.job_id:
        raise HTTPException(status_code=400, detail='job_description or job_id is required')
    return schemas.MatchingResponse(match_score=0.0, matched_skills=[], missing_skills=[])


@router.get('/jobs')
def get_jobs(resumeId: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return []
