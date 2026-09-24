from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..dependencies import get_current_user, get_db
from ..services.interview_intelligence import InterviewIntelligenceError, evaluate_answer, generate_questions

router = APIRouter(prefix='/interview', tags=['interview'])


@router.post('/start', response_model=schemas.InterviewSessionRead)
def start_interview(request: schemas.InterviewStartRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    resume = crud.get_resume(db, request.resume_id)
    if resume is None or resume.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Resume not found')
    questions = generate_questions(resume, request.target_role, request.interview_type)
    session = crud.create_interview_session(db, current_user.id, request.resume_id, request.target_role, questions)
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


@router.get('/{session_id}', response_model=schemas.InterviewSessionRead)
def get_interview_session(session_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    session = crud.get_interview_session(db, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail='Interview session not found')
    return session
