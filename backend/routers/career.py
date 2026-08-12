from fastapi import APIRouter, Depends
from .. import schemas
from ..dependencies import get_current_user, get_db

router = APIRouter(prefix='/career', tags=['career'])


@router.post('/analyze', response_model=schemas.CareerRoadmapResponse)
def analyze_career(request: schemas.CareerAnalyzeRequest, db=Depends(get_db), current_user=Depends(get_current_user)):
    return schemas.CareerRoadmapResponse(roadmap=[])


@router.post('/roadmap', response_model=schemas.CareerRoadmapResponse)
def create_roadmap(request: schemas.CareerAnalyzeRequest, db=Depends(get_db), current_user=Depends(get_current_user)):
    return schemas.CareerRoadmapResponse(roadmap=[])
