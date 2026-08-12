import os
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from .. import crud, config, schemas
from ..dependencies import get_current_user, get_db

router = APIRouter(prefix='/resumes', tags=['resumes'])


@router.post('/upload', response_model=schemas.ResumeUploadResponse, status_code=status.HTTP_201_CREATED)
def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if file.content_type not in ('application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Unsupported file type')

    upload_root = os.path.abspath(config.settings.upload_dir)
    user_folder = os.path.join(upload_root, str(current_user.id))
    os.makedirs(user_folder, exist_ok=True)
    destination_path = os.path.join(user_folder, file.filename)

    with open(destination_path, 'wb') as buffer:
        buffer.write(file.file.read())

    resume = crud.create_resume(db, current_user.id, file.filename, destination_path)
    return schemas.ResumeUploadResponse(id=resume.id, filename=resume.filename, status=resume.status)


@router.get('/', response_model=list[schemas.ResumeRead])
def list_resumes(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return crud.list_resumes(db, current_user.id)


@router.get('/{resume_id}', response_model=schemas.ResumeRead)
def get_resume(resume_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    resume = crud.get_resume(db, resume_id)
    if not resume or resume.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Resume not found')
    return resume


@router.get('/{resume_id}/analysis', response_model=schemas.ResumeAnalysisResponse)
def get_resume_analysis(resume_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    resume = crud.get_resume(db, resume_id)
    if not resume or resume.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Resume not found')
    return schemas.ResumeAnalysisResponse(
        overall_score=0.0,
        keyword_score=0.0,
        missing_keywords=[],
        recommendations=[],
    )
