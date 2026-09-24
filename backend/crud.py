from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from . import models, schemas
from .security import get_password_hash, verify_password


def create_user(db: Session, user_in: schemas.UserCreate) -> models.User:
    user = models.User(
        name=user_in.name,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.scalar(select(models.User).where(models.User.email == email))


def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.scalar(select(models.User).where(models.User.id == user_id))


def update_user(db: Session, user: models.User, updates: schemas.UserUpdate) -> models.User:
    if updates.name is not None:
        user.name = updates.name
    if updates.email is not None:
        user.email = updates.email
    user.updated_at = datetime.utcnow()
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_resume(db: Session, user_id: int, filename: str, file_path: str) -> models.Resume:
    resume = models.Resume(user_id=user_id, filename=filename, file_path=file_path, status='uploaded')
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


def get_resume(db: Session, resume_id: int) -> Optional[models.Resume]:
    return db.scalar(select(models.Resume).where(models.Resume.id == resume_id))


def list_resumes(db: Session, user_id: int) -> list[models.Resume]:
    return db.scalars(select(models.Resume).where(models.Resume.user_id == user_id).order_by(models.Resume.uploaded_at.desc())).all()


def get_latest_ats_result(db: Session, user_id: int) -> Optional[models.ResumeAnalysis]:
    return db.scalar(
        select(models.ResumeAnalysis)
        .join(models.Resume)
        .where(models.Resume.user_id == user_id)
        .order_by(models.ResumeAnalysis.created_at.desc())
    )


def create_ats_result(db: Session, resume_id: int, analysis: Optional[dict] = None) -> models.ResumeAnalysis:
    analysis = analysis or {}
    ats = models.ResumeAnalysis(
        resume_id=resume_id,
        overall_score=analysis.get('overall_score', 0.0),
        keyword_score=analysis.get('keyword_score', 0.0),
        missing_keywords=analysis.get('missing_keywords', []),
        extracted_skills=analysis.get('extracted_skills', []),
        missing_skills=analysis.get('missing_skills', []),
        recommended_skills=analysis.get('recommended_skills', []),
        recommendations=analysis.get('recommendations', []),
        section_analysis=analysis.get('section_analysis', {}),
        embedding=analysis.get('embedding'),
        embedding_model=analysis.get('embedding_model'),
    )
    db.add(ats)
    db.commit()
    db.refresh(ats)
    return ats


def update_resume_analysis_text(db: Session, resume: models.Resume, extracted_text: str) -> models.Resume:
    resume.extracted_text = extracted_text
    resume.status = 'analyzed'
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


def create_job_match(
    db: Session,
    resume_id: int,
    job_id: int,
    match_score: float = 0.0,
    matched_skills: Optional[list[str]] = None,
    missing_skills: Optional[list[str]] = None,
    similarity_score: Optional[float] = None,
    embedding_model: Optional[str] = None,
) -> models.JobMatch:
    match = models.JobMatch(
        resume_id=resume_id,
        job_id=job_id,
        match_score=match_score,
        similarity_score=similarity_score,
        matched_skills=matched_skills or [],
        missing_skills=missing_skills or [],
        embedding_model=embedding_model,
    )
    db.add(match)
    db.commit()
    db.refresh(match)
    return match


def create_career_roadmap(
    db: Session,
    user_id: int,
    target_role: str,
    resume_id: Optional[int] = None,
    roadmap: Optional[list[dict]] = None,
    role_id: Optional[int] = None,
    missing_skills: Optional[list[str]] = None,
    recommended_skills: Optional[list[str]] = None,
) -> models.CareerRoadmap:
    career_roadmap = models.CareerRoadmap(
        user_id=user_id,
        resume_id=resume_id,
        target_role=target_role,
        role_id=role_id,
        roadmap=roadmap or [],
        missing_skills=missing_skills or [],
        recommended_skills=recommended_skills or [],
    )
    db.add(career_roadmap)
    db.commit()
    db.refresh(career_roadmap)
    return career_roadmap


def create_job(
    db: Session,
    owner_user_id: int,
    job_data: schemas.JobCreate,
    intelligence: dict,
) -> models.Job:
    job = models.Job(
        owner_user_id=owner_user_id,
        title=job_data.title.strip(),
        company=job_data.company.strip() if job_data.company else None,
        description=intelligence['description'],
        location=job_data.location.strip() if job_data.location else None,
        required_skills=intelligence['required_skills'],
        embedding=intelligence['embedding'],
        embedding_model=intelligence['embedding_model'],
    )
    job.skills = [models.JobSkill(skill_name=skill) for skill in intelligence['required_skills']]
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def list_jobs(db: Session, owner_user_id: int) -> list[models.Job]:
    return db.scalars(
        select(models.Job).where(
            (models.Job.owner_user_id.is_(None)) | (models.Job.owner_user_id == owner_user_id)
        ).order_by(models.Job.posted_at.desc())
    ).all()


def get_job_match(db: Session, resume_id: int, job_id: int) -> Optional[models.JobMatch]:
    return db.scalar(
        select(models.JobMatch).where(
            models.JobMatch.resume_id == resume_id,
            models.JobMatch.job_id == job_id,
        )
    )


def save_job_match(db: Session, resume_id: int, job_id: int, result: dict) -> models.JobMatch:
    match = get_job_match(db, resume_id, job_id)
    if match is None:
        match = models.JobMatch(resume_id=resume_id, job_id=job_id)
    match.match_score = result['match_score']
    match.similarity_score = result['similarity_score']
    match.matched_skills = result['matched_skills']
    match.missing_skills = result['missing_skills']
    match.embedding_model = result['embedding_model']
    db.add(match)
    db.commit()
    db.refresh(match)
    return match


def create_career_role(db: Session, role_data: schemas.CareerRoleCreate) -> models.CareerRole:
    role = models.CareerRole(name=role_data.name.strip(), description=role_data.description)
    role.skills = [models.CareerRoleSkill(skill_name=skill.strip()) for skill in role_data.required_skills if skill.strip()]
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


def list_career_roles(db: Session) -> list[models.CareerRole]:
    return db.scalars(select(models.CareerRole).order_by(models.CareerRole.name)).all()


def get_latest_career_roadmap(db: Session, user_id: int, resume_id: Optional[int] = None) -> Optional[models.CareerRoadmap]:
    query = select(models.CareerRoadmap).where(models.CareerRoadmap.user_id == user_id)
    if resume_id is not None:
        query = query.where(models.CareerRoadmap.resume_id == resume_id)
    return db.scalar(query.order_by(models.CareerRoadmap.updated_at.desc()))


def create_interview_session(db: Session, user_id: int, resume_id: Optional[int], target_role: str) -> models.InterviewSession:
    session = models.InterviewSession(
        user_id=user_id,
        resume_id=resume_id,
        target_role=target_role,
        status='pending',
        questions=[],
        feedback=[],
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_interview_session(db: Session, session_id: int) -> Optional[models.InterviewSession]:
    return db.scalar(select(models.InterviewSession).where(models.InterviewSession.id == session_id))


def get_dashboard_metrics(db: Session, user_id: int) -> schemas.DashboardMetrics:
    latest_ats = get_latest_ats_result(db, user_id)
    resume = None
    if latest_ats is not None:
        resume = latest_ats.resume
    return schemas.DashboardMetrics(
        readiness_score=0.0,
        recent_ats_score=latest_ats.overall_score if latest_ats else 0.0,
        active_resume_id=resume.id if resume else None,
        recent_applications=[],
        recent_interviews=[],
    )
