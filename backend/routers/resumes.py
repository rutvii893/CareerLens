import os
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from .. import config, crud, schemas
from ..dependencies import get_current_user, get_db
from ..services.resume_intelligence import ResumeIntelligenceError, analyze_resume_file

router = APIRouter(prefix='/resumes', tags=['resumes'])
MAX_RESUME_BYTES = 10 * 1024 * 1024


@router.post('/upload', response_model=schemas.ResumeUploadResponse, status_code=status.HTTP_201_CREATED)
def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if file.content_type not in ('application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Unsupported file type')

    upload_root = os.path.abspath(config.settings.upload_dir)
    user_folder = os.path.join(upload_root, str(current_user.id))
    os.makedirs(user_folder, exist_ok=True)
    original_filename = os.path.basename(file.filename or 'resume')
    stored_filename = f'{uuid4().hex}_{original_filename}'
    destination_path = os.path.join(user_folder, stored_filename)
    file_bytes = file.file.read(MAX_RESUME_BYTES + 1)
    if len(file_bytes) > MAX_RESUME_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail='Resume file must be 10 MB or smaller')
    with open(destination_path, 'wb') as buffer:
        buffer.write(file_bytes)

    resume = crud.create_resume(db, current_user.id, original_filename, destination_path)
    try:
        analysis = analyze_resume_file(destination_path, file.content_type)
    except ResumeIntelligenceError as exc:
        resume.status = 'extraction_failed'
        db.add(resume)
        db.commit()
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    crud.update_resume_analysis_text(db, resume, analysis['extracted_text'])
    crud.create_ats_result(db, resume.id, analysis)
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
    analysis = resume.ats_results[-1] if resume.ats_results else None
    if analysis is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Resume analysis not found')
    return schemas.ResumeAnalysisResponse.model_validate(analysis, from_attributes=True)
