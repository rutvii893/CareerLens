from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..dependencies import get_current_user, get_db
from ..services.resume_pdf import generate_resume_pdf, list_templates
from ..services.resume_generator import generate_summary

router = APIRouter(prefix='/resume-generator', tags=['resume-generator'])
TEMPLATE_PATTERN = '^(classic|modern|minimal|professional|student)$'


def _resume_data(payload: schemas.GeneratedResumeUpsert) -> dict:
    data = payload.model_dump(mode='json')
    data['title'] = data['title'].strip() or f"{data['career_role']} Resume"
    data['career_role'] = data['career_role'].strip()
    data['soft_skills'] = [skill.strip() for skill in data['soft_skills'] if skill.strip()]
    return data


def _get_owned_resume(db: Session, resume_id: int, user_id: int) -> models.GeneratedResume:
    resume = db.scalar(
        select(models.GeneratedResume).where(
            models.GeneratedResume.id == resume_id,
            models.GeneratedResume.user_id == user_id,
        )
    )
    if resume is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Generated resume not found')
    return resume


@router.post('/resumes', response_model=schemas.GeneratedResumeRead, status_code=status.HTTP_201_CREATED)
def create_generated_resume(
    payload: schemas.GeneratedResumeUpsert,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    resume = models.GeneratedResume(user_id=current_user.id, **_resume_data(payload))
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


@router.get('/resumes', response_model=list[schemas.GeneratedResumeRead])
def list_generated_resumes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return db.scalars(
        select(models.GeneratedResume)
        .where(models.GeneratedResume.user_id == current_user.id)
        .order_by(models.GeneratedResume.updated_at.desc())
    ).all()


@router.get('/resumes/{resume_id}', response_model=schemas.GeneratedResumeRead)
def get_generated_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return _get_owned_resume(db, resume_id, current_user.id)


@router.get('/templates')
def get_resume_templates(current_user: models.User = Depends(get_current_user)):
    del current_user
    return list_templates()


@router.put('/resumes/{resume_id}', response_model=schemas.GeneratedResumeRead)
def update_generated_resume(
    resume_id: int,
    payload: schemas.GeneratedResumeUpsert,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    resume = _get_owned_resume(db, resume_id, current_user.id)
    for field, value in _resume_data(payload).items():
        setattr(resume, field, value)
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


@router.get('/resumes/{resume_id}/pdf')
def download_generated_resume_pdf(
    resume_id: int,
    template: str | None = Query(None, pattern=TEMPLATE_PATTERN),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    resume = _get_owned_resume(db, resume_id, current_user.id)
    selected_template = template or resume.template
    pdf = generate_resume_pdf(
        schemas.GeneratedResumeRead.model_validate(resume).model_dump(mode='json'),
        selected_template,
    )
    filename = f'CareerLens-Resume-{resume.id}-{selected_template}.pdf'
    return Response(
        content=pdf,
        media_type='application/pdf',
        headers={
            'Content-Disposition': f'attachment; filename="{filename}"',
            'Cache-Control': 'private, no-store',
        },
    )


@router.delete('/resumes/{resume_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_generated_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    resume = _get_owned_resume(db, resume_id, current_user.id)
    db.delete(resume)
    db.commit()


@router.post('/summary')
def create_resume_summary(
    payload: schemas.GeneratedResumeUpsert,
    current_user: models.User = Depends(get_current_user),
):
    del current_user
    return {'summary': generate_summary(payload)}


@router.post('/finalize', response_model=schemas.GeneratedResumeUpsert)
def finalize_resume(
    payload: schemas.GeneratedResumeUpsert,
    current_user: models.User = Depends(get_current_user),
):
    del current_user
    data = payload.model_dump()
    data['summary'] = generate_summary(payload)
    return data
