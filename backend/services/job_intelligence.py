from __future__ import annotations

from typing import Iterable

from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models
from .resume_intelligence import clean_resume_text, cosine_similarity, create_embedding, extract_skills


class JobIntelligenceError(Exception):
    """Raised when a job comparison cannot be completed."""


def _skill_key(skill: str) -> str:
    return ' '.join(skill.casefold().split())


def analyze_job_description(description: str) -> dict:
    cleaned = clean_resume_text(description)
    if len(cleaned) < 20:
        raise JobIntelligenceError('Job description must contain at least 20 readable characters')
    skills = extract_skills(cleaned)
    embedding, embedding_model = create_embedding(cleaned)
    return {
        'description': cleaned,
        'required_skills': skills,
        'embedding': embedding,
        'embedding_model': embedding_model,
    }


def compare_resume_to_job(resume: models.Resume, job: models.Job) -> dict:
    resume_text = clean_resume_text(resume.extracted_text or '')
    if not resume_text:
        raise JobIntelligenceError('Resume has no extracted text')

    resume_skills = extract_skills(resume_text)
    required_skills = list(job.required_skills or [])
    resume_by_key = {_skill_key(skill): skill for skill in resume_skills}
    matched = [skill for skill in required_skills if _skill_key(skill) in resume_by_key]
    missing = [skill for skill in required_skills if _skill_key(skill) not in resume_by_key]
    skill_score = (len(matched) / len(required_skills) * 100) if required_skills else 0.0

    resume_embedding = None
    embedding_model = job.embedding_model
    if job.embedding is not None:
        resume_embedding, _ = create_embedding(resume_text)
    similarity_score = None
    if resume_embedding is not None and job.embedding:
        similarity_score = round(max(0.0, cosine_similarity(resume_embedding, job.embedding)) * 100, 2)
        match_score = round((skill_score * 0.7) + (similarity_score * 0.3), 2)
    else:
        match_score = round(skill_score, 2)
        embedding_model = None

    return {
        'match_score': match_score,
        'similarity_score': similarity_score,
        'matched_skills': matched,
        'missing_skills': missing,
        'embedding_model': embedding_model,
    }


def get_owned_job(db: Session, job_id: int, user_id: int) -> models.Job | None:
    return db.scalar(
        select(models.Job).where(
            models.Job.id == job_id,
            (models.Job.owner_user_id.is_(None)) | (models.Job.owner_user_id == user_id),
        )
    )
