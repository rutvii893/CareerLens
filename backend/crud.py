from datetime import datetime
from typing import List, Optional

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from . import models, schemas
from .security import get_password_hash, verify_password


def create_user(db: Session, user_in: schemas.UserCreate) -> models.User:
    now = datetime.utcnow()
    user = models.User(
        name=user_in.name,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
        custom_skills=[],
        preferences={},
        created_at=now,
        updated_at=now,
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
        user.name = updates.name.strip()
    if updates.email is not None:
        user.email = updates.email
    if updates.target_role is not None:
        user.target_role = updates.target_role.strip() if updates.target_role else None
    if updates.location is not None:
        user.location = updates.location.strip() if updates.location else None
    if updates.bio is not None:
        user.bio = updates.bio.strip() if updates.bio else None
    if updates.education is not None:
        user.education = updates.education.strip() if updates.education else None
    if updates.experience is not None:
        user.experience = updates.experience.strip() if updates.experience else None
    if updates.custom_skills is not None:
        user.custom_skills = [s.strip() for s in updates.custom_skills if s.strip()]
    if updates.preferences is not None:
        user.preferences = updates.preferences
    user.updated_at = datetime.utcnow()
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def add_user_custom_skill(db: Session, user_id: int, skill_name: str) -> List[str]:
    user = get_user(db, user_id)
    if not user:
        return []
    current = list(user.custom_skills or [])
    cleaned = skill_name.strip()
    if cleaned and not any(s.lower() == cleaned.lower() for s in current):
        current.append(cleaned)
        user.custom_skills = current
        user.updated_at = datetime.utcnow()
        db.add(user)
        db.commit()
        db.refresh(user)
    return user.custom_skills or []


def remove_user_custom_skill(db: Session, user_id: int, skill_name: str) -> List[str]:
    user = get_user(db, user_id)
    if not user:
        return []
    current = list(user.custom_skills or [])
    cleaned = skill_name.strip().lower()
    updated = [s for s in current if s.lower() != cleaned]
    user.custom_skills = updated
    user.updated_at = datetime.utcnow()
    db.add(user)
    db.commit()
    db.refresh(user)
    return user.custom_skills or []


def create_resume(db: Session, user_id: int, filename: str, file_path: str) -> models.Resume:
    now = datetime.utcnow()
    resume = models.Resume(user_id=user_id, filename=filename, file_path=file_path, status='uploaded', uploaded_at=now)
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
        .order_by(desc(models.ResumeAnalysis.created_at))
    )


def create_ats_result(db: Session, resume_id: int, analysis: Optional[dict] = None) -> models.ResumeAnalysis:
    analysis = analysis or {}
    now = datetime.utcnow()
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
        created_at=now,
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
    now = datetime.utcnow()
    match = models.JobMatch(
        resume_id=resume_id,
        job_id=job_id,
        match_score=match_score,
        similarity_score=similarity_score,
        matched_skills=matched_skills or [],
        missing_skills=missing_skills or [],
        embedding_model=embedding_model,
        created_at=now,
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
    now = datetime.utcnow()
    career_roadmap = models.CareerRoadmap(
        user_id=user_id,
        resume_id=resume_id,
        target_role=target_role,
        role_id=role_id,
        roadmap=roadmap or [],
        missing_skills=missing_skills or [],
        recommended_skills=recommended_skills or [],
        status='draft',
        created_at=now,
        updated_at=now,
    )
    db.add(career_roadmap)
    db.commit()
    db.refresh(career_roadmap)
    return career_roadmap


def update_career_roadmap_phase(db: Session, roadmap_id: int, user_id: int, phase_idx: int, phase_status: str) -> Optional[models.CareerRoadmap]:
    roadmap_obj = db.scalar(
        select(models.CareerRoadmap).where(models.CareerRoadmap.id == roadmap_id, models.CareerRoadmap.user_id == user_id)
    )
    if not roadmap_obj:
        return None

    items = list(roadmap_obj.roadmap or [])
    if 0 <= phase_idx < len(items):
        items[phase_idx] = dict(items[phase_idx])
        items[phase_idx]['status'] = phase_status
        roadmap_obj.roadmap = items
        roadmap_obj.updated_at = datetime.utcnow()
        completed = sum(1 for item in items if item.get('status') in {'completed', 'done'})
        if completed == len(items):
            roadmap_obj.status = 'completed'
        elif completed > 0:
            roadmap_obj.status = 'in_progress'
        else:
            roadmap_obj.status = 'draft'
        db.add(roadmap_obj)
        db.commit()
        db.refresh(roadmap_obj)
    return roadmap_obj


def list_user_roadmaps(db: Session, user_id: int) -> list[models.CareerRoadmap]:
    return db.scalars(
        select(models.CareerRoadmap).where(models.CareerRoadmap.user_id == user_id).order_by(desc(models.CareerRoadmap.updated_at))
    ).all()


def create_job(
    db: Session,
    owner_user_id: int,
    job_data: schemas.JobCreate,
    intelligence: dict,
) -> models.Job:
    now = datetime.utcnow()
    job = models.Job(
        owner_user_id=owner_user_id,
        title=job_data.title.strip(),
        company=job_data.company.strip() if job_data.company else None,
        description=intelligence['description'],
        location=job_data.location.strip() if job_data.location else None,
        required_skills=intelligence['required_skills'],
        embedding=intelligence['embedding'],
        embedding_model=intelligence['embedding_model'],
        posted_at=now,
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
    now = datetime.utcnow()
    if match is None:
        match = models.JobMatch(resume_id=resume_id, job_id=job_id, created_at=now)
    match.match_score = result['match_score']
    match.similarity_score = result['similarity_score']
    match.matched_skills = result['matched_skills']
    match.missing_skills = result['missing_skills']
    match.embedding_model = result['embedding_model']
    db.add(match)
    db.commit()
    db.refresh(match)
    return match


def create_saved_job(db: Session, user_id: int, job_in: schemas.SavedJobCreate) -> models.Application:
    now = datetime.utcnow()
    application = models.Application(
        user_id=user_id,
        job_id=job_in.job_id,
        job_title=job_in.job_title.strip() if job_in.job_title else None,
        company=job_in.company.strip() if job_in.company else None,
        location=job_in.location.strip() if job_in.location else None,
        redirect_url=job_in.redirect_url,
        salary=job_in.salary,
        matched_skills=job_in.matched_skills or [],
        missing_skills=job_in.missing_skills or [],
        match_score=job_in.match_score,
        status=job_in.status or 'saved',
        notes=job_in.notes,
        applied_at=now,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


def get_user_saved_jobs(db: Session, user_id: int) -> list[models.Application]:
    return db.scalars(
        select(models.Application).where(models.Application.user_id == user_id).order_by(desc(models.Application.applied_at))
    ).all()


def get_user_application(db: Session, application_id: int, user_id: int) -> Optional[models.Application]:
    return db.scalar(
        select(models.Application).where(models.Application.id == application_id, models.Application.user_id == user_id)
    )


def update_application_status(db: Session, application: models.Application, update_data: schemas.ApplicationStatusUpdate) -> models.Application:
    application.status = update_data.status
    if update_data.notes is not None:
        application.notes = update_data.notes
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


def delete_user_application(db: Session, application_id: int, user_id: int) -> bool:
    app = get_user_application(db, application_id, user_id)
    if app:
        db.delete(app)
        db.commit()
        return True
    return False


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
    return db.scalar(query.order_by(desc(models.CareerRoadmap.updated_at)))


def create_interview_session(
    db: Session,
    user_id: int,
    resume_id: Optional[int],
    target_role: str,
    questions: Optional[list[dict]] = None,
) -> models.InterviewSession:
    now = datetime.utcnow()
    session = models.InterviewSession(
        user_id=user_id,
        resume_id=resume_id,
        target_role=target_role,
        status='pending',
        questions=questions or [],
        answers=[],
        feedback=[],
        created_at=now,
        updated_at=now,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_interview_session(db: Session, session_id: int) -> Optional[models.InterviewSession]:
    return db.scalar(select(models.InterviewSession).where(models.InterviewSession.id == session_id))


def list_user_interview_sessions(db: Session, user_id: int) -> list[models.InterviewSession]:
    return db.scalars(
        select(models.InterviewSession).where(models.InterviewSession.user_id == user_id).order_by(desc(models.InterviewSession.updated_at))
    ).all()


def save_interview_evaluation(db: Session, session: models.InterviewSession, question_id: int, answer_text: str, evaluation: dict) -> models.InterviewSession:
    answers = list(session.answers or [])
    answers.append({'question_id': question_id, 'answer_text': answer_text})
    feedback = list(session.feedback or [])
    feedback.append({'question_id': question_id, **evaluation})
    session.answers = answers
    session.feedback = feedback
    session.score = round(sum(item['score'] for item in feedback) / len(feedback), 2)
    session.status = 'completed' if len(feedback) >= len(session.questions) else 'in_progress'
    session.updated_at = datetime.utcnow()
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_dashboard_metrics(db: Session, user_id: int) -> schemas.DashboardMetrics:
    user = get_user(db, user_id)
    latest_ats = get_latest_ats_result(db, user_id)
    resume = latest_ats.resume if latest_ats is not None else db.scalar(
        select(models.Resume)
        .where(models.Resume.user_id == user_id)
        .order_by(desc(models.Resume.uploaded_at))
    )
    resume_id = resume.id if resume else None
    resume_filename = resume.filename if resume else None

    # Extracted skills from resume + custom user skills
    extracted = list(latest_ats.extracted_skills or []) if latest_ats else []
    custom = list(user.custom_skills or []) if user else []
    all_skills_unique = list(dict.fromkeys(extracted + custom))

    matches = []
    if resume_id is not None:
        matches = db.scalars(
            select(models.JobMatch)
            .where(models.JobMatch.resume_id == resume_id)
            .order_by(desc(models.JobMatch.match_score))
        ).all()
    top_match = matches[0] if matches else None

    roadmap = get_latest_career_roadmap(db, user_id, resume_id)
    interviews = list_user_interview_sessions(db, user_id)
    scored_interviews = [session.score for session in interviews if session.score is not None]
    interview_average = round(sum(scored_interviews) / len(scored_interviews), 2) if scored_interviews else 0.0

    roadmap_items = roadmap.roadmap if roadmap else []
    completed_phases = sum(1 for item in roadmap_items if item.get('status') in {'completed', 'done'})
    roadmap_percentage = round((completed_phases / len(roadmap_items)) * 100, 2) if roadmap_items else 0.0
    career_gap = list(roadmap.missing_skills or []) if roadmap else []
    career_score = max(0.0, 100.0 - (len(career_gap) * 15.0)) if roadmap else 0.0

    ats_score = float(latest_ats.overall_score or 0.0) if latest_ats else 0.0
    job_score = float(top_match.match_score or 0.0) if top_match else 0.0

    # Overall career readiness composite
    components = []
    if latest_ats:
        components.append(ats_score * 0.35)
    if top_match:
        components.append(job_score * 0.20)
    if roadmap:
        components.append((career_score * 0.20) + (roadmap_percentage * 0.10))
    if scored_interviews:
        components.append(interview_average * 0.15)
    
    readiness = round(sum(components), 2) if components else 0.0

    # Applications and Saved Jobs
    applications = get_user_saved_jobs(db, user_id)
    saved_count = sum(1 for a in applications if a.status == 'saved')
    applied_count = sum(1 for a in applications if a.status != 'saved')

    # Build chronological recent activity
    recent_activity = []
    if latest_ats and resume:
        recent_activity.append({
            'type': 'resume_analysis',
            'title': f'Analyzed resume: {resume.filename}',
            'timestamp': latest_ats.created_at.isoformat() if latest_ats.created_at else None,
            'details': f'Score: {Math_round_helper(latest_ats.overall_score)}/100',
            'link': f'/resume/analysis?resumeId={resume.id}',
        })
    for app in applications[:4]:
        recent_activity.append({
            'type': 'job_application',
            'title': f'{app.status.capitalize()}: {app.job_title or "Job listing"}',
            'timestamp': app.applied_at.isoformat() if app.applied_at else None,
            'details': f'{app.company or "Company"} • {app.status}',
            'link': '/jobs',
        })
    for sess in interviews[:3]:
        recent_activity.append({
            'type': 'interview',
            'title': f'Interview session: {sess.target_role or "General"}',
            'timestamp': sess.created_at.isoformat() if sess.created_at else None,
            'details': f'Score: {Math_round_helper(sess.score)}/100 • {len(sess.answers or [])} answered',
            'link': '/interview',
        })

    return schemas.DashboardMetrics(
        readiness_score=readiness,
        recent_ats_score=ats_score,
        active_resume_id=resume_id,
        active_resume_filename=resume_filename,
        extracted_skills=all_skills_unique,
        total_skills_count=len(all_skills_unique),
        resume_improvement=list(latest_ats.recommendations or []) if latest_ats else [],
        job_match_percentage=job_score,
        matching_skills=list(top_match.matched_skills or []) if top_match else [],
        missing_skills=list(top_match.missing_skills or []) if top_match else [],
        recommended_jobs=[
            {'id': match.job.id, 'title': match.job.title, 'company': match.job.company, 'match_score': match.match_score}
            for match in matches[:5]
            if match.job is not None
        ],
        career_skill_gap=career_gap,
        roadmap_progress={
            'id': roadmap.id if roadmap else None,
            'target_role': roadmap.target_role if roadmap else (user.target_role if user else None),
            'completed_phases': completed_phases,
            'total_phases': len(roadmap_items),
            'percentage': roadmap_percentage,
        },
        interview_performance={'average_score': interview_average, 'session_count': len(interviews)},
        career_readiness_overview={
            'ats_score': ats_score,
            'job_match_score': job_score,
            'career_skill_score': career_score,
            'roadmap_score': roadmap_percentage,
            'interview_score': interview_average,
        },
        saved_jobs_count=saved_count,
        applications_count=applied_count,
        recent_applications=[
            {
                'id': app.id,
                'job_title': app.job_title,
                'company': app.company,
                'location': app.location,
                'status': app.status,
                'applied_at': app.applied_at.isoformat() if app.applied_at else None,
            }
            for app in applications[:5]
        ],
        recent_interviews=[
            {'id': session.id, 'target_role': session.target_role, 'score': session.score, 'status': session.status}
            for session in interviews[:5]
        ],
        recent_activity=recent_activity[:6],
    )


def Math_round_helper(val) -> int:
    return int(round(val)) if val is not None else 0
