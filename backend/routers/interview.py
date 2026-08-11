from fastapi import APIRouter, Depends, HTTPException
from .. import crud, schemas
from ..dependencies import get_current_user, get_db

router = APIRouter(prefix='/interview', tags=['interview'])


@router.post('/start', response_model=schemas.InterviewSessionRead)
def start_interview(request: schemas.InterviewStartRequest, db=Depends(get_db), current_user=Depends(get_current_user)):
    session = crud.create_interview_session(db, current_user.id, request.resume_id, request.target_role)
    return schemas.InterviewSessionRead(
        id=session.id,
        user_id=session.user_id,
        resume_id=session.resume_id,
        target_role=session.target_role,
        status=session.status,
        questions=[],
        score=None,
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


@router.post('/evaluate')
def evaluate_interview(request: schemas.InterviewEvaluateRequest, db=Depends(get_db), current_user=Depends(get_current_user)):
    session = crud.get_interview_session(db, request.session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail='Interview session not found')
    return {'session_id': session.id, 'score': 0.0, 'feedback': []}


@router.get('/{session_id}', response_model=schemas.InterviewSessionRead)
def get_interview_session(session_id: int, db=Depends(get_db), current_user=Depends(get_current_user)):
    session = crud.get_interview_session(db, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail='Interview session not found')
    return schemas.InterviewSessionRead(
        id=session.id,
        user_id=session.user_id,
        resume_id=session.resume_id,
        target_role=session.target_role,
        status=session.status,
        questions=[],
        score=session.score,
        created_at=session.created_at,
        updated_at=session.updated_at,
    )
