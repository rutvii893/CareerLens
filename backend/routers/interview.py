from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..dependencies import get_current_user, get_db
from ..services.interview_intelligence import InterviewIntelligenceError, evaluate_answer, generate_questions

router = APIRouter(prefix='/interview', tags=['interview'])


@router.post('/start', response_model=schemas.InterviewSessionRead)
def start_interview(request: schemas.InterviewStartRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    resume = None
    if request.resume_id is not None:
        resume = crud.get_resume(db, request.resume_id)
        if resume is None or resume.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Resume not found')
    else:
        # Check latest user resume
        latest_ats = crud.get_latest_ats_result(db, current_user.id)
        if latest_ats and latest_ats.resume:
            resume = latest_ats.resume

    user_db = crud.get_user(db, current_user.id)
    custom_skills = list(user_db.custom_skills or []) if user_db else []

    questions = generate_questions(resume, request.target_role, request.interview_type, custom_skills)
    session = crud.create_interview_session(db, current_user.id, resume.id if resume else None, request.target_role, questions)
    return session


@router.post('/evaluate', response_model=schemas.InterviewEvaluationResponse)
def evaluate_interview(request: schemas.InterviewEvaluateRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    session = crud.get_interview_session(db, request.session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail='Interview session not found')
    question = next((item for item in session.questions if item.get('id') == request.question_id), None)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Interview question not found')
    evaluation = evaluate_answer(question, request.answer_text)
    crud.save_interview_evaluation(db, session, request.question_id, request.answer_text, evaluation)
    return schemas.InterviewEvaluationResponse(session_id=session.id, question_id=request.question_id, **evaluation)


@router.get('/sessions', response_model=list[schemas.InterviewSessionRead])
def list_interview_sessions(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """List all interview prep sessions and evaluation scores for the current user."""
    return crud.list_user_interview_sessions(db, current_user.id)


@router.get('/{session_id}', response_model=schemas.InterviewSessionRead)
def get_interview_session(session_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    session = crud.get_interview_session(db, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail='Interview session not found')
    return session
