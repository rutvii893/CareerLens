from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, ForeignKey, Integer, JSON, String, Text, Float, UniqueConstraint, func
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    email = Column(String(256), nullable=False, unique=True, index=True)
    hashed_password = Column(String(256), nullable=False)
    role = Column(String(32), nullable=False, default='student')
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    resumes = relationship('Resume', back_populates='user', cascade='all, delete-orphan')
    applications = relationship('Application', back_populates='user', cascade='all, delete-orphan')
    interview_sessions = relationship('InterviewSession', back_populates='user', cascade='all, delete-orphan')
    career_roadmaps = relationship('CareerRoadmap', back_populates='user', cascade='all, delete-orphan')
    jobs = relationship('Job', back_populates='owner')

    __table_args__ = (
        CheckConstraint("char_length(trim(name)) > 0", name='ck_users_name_not_blank'),
    )


class Resume(Base):
    __tablename__ = 'resumes'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    status = Column(String(64), nullable=False, default='uploaded')
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    extracted_text = Column(Text, nullable=True)
    active = Column(Boolean, default=False, nullable=False)

    user = relationship('User', back_populates='resumes')
    ats_results = relationship('ResumeAnalysis', back_populates='resume', cascade='all, delete-orphan')
    job_matches = relationship('JobMatch', back_populates='resume', cascade='all, delete-orphan')
    career_roadmaps = relationship('CareerRoadmap', back_populates='resume')
    interview_sessions = relationship('InterviewSession', back_populates='resume')


class ResumeAnalysis(Base):
    __tablename__ = 'ats_results'

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey('resumes.id', ondelete='CASCADE'), nullable=False)
    overall_score = Column(Float, nullable=True)
    keyword_score = Column(Float, nullable=True)
    missing_keywords = Column(JSON, nullable=False, default=list)
    extracted_skills = Column(JSON, nullable=False, default=list)
    missing_skills = Column(JSON, nullable=False, default=list)
    recommended_skills = Column(JSON, nullable=False, default=list)
    recommendations = Column(JSON, nullable=False, default=list)
    section_analysis = Column(JSON, nullable=False, default=dict)
    embedding = Column(JSON, nullable=True)
    embedding_model = Column(String(128), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    resume = relationship('Resume', back_populates='ats_results')

    __table_args__ = (
        CheckConstraint('overall_score IS NULL OR (overall_score >= 0 AND overall_score <= 100)', name='ck_ats_results_overall_score_range'),
        CheckConstraint('keyword_score IS NULL OR (keyword_score >= 0 AND keyword_score <= 100)', name='ck_ats_results_keyword_score_range'),
    )


# Compatibility name for existing CRUD callers and integrations.
ATSResult = ResumeAnalysis


class Job(Base):
    __tablename__ = 'jobs'

    id = Column(Integer, primary_key=True, index=True)
    owner_user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    location = Column(String(128), nullable=True)
    required_skills = Column(JSON, nullable=False, default=list)
    embedding = Column(JSON, nullable=True)
    embedding_model = Column(String(128), nullable=True)
    posted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    owner = relationship('User', back_populates='jobs')
    applications = relationship('Application', back_populates='job', cascade='all, delete-orphan')
    job_matches = relationship('JobMatch', back_populates='job', cascade='all, delete-orphan')
    skills = relationship('JobSkill', back_populates='job', cascade='all, delete-orphan')


class JobSkill(Base):
    __tablename__ = 'job_skills'

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey('jobs.id', ondelete='CASCADE'), nullable=False)
    skill_name = Column(String(128), nullable=False)
    required = Column(Boolean, nullable=False, default=True)

    job = relationship('Job', back_populates='skills')

    __table_args__ = (
        UniqueConstraint('job_id', 'skill_name', name='uq_job_skills_job_skill'),
    )


class JobMatch(Base):
    __tablename__ = 'job_matches'

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey('resumes.id', ondelete='CASCADE'), nullable=False)
    job_id = Column(Integer, ForeignKey('jobs.id', ondelete='CASCADE'), nullable=False)
    match_score = Column(Float, nullable=False, default=0.0)
    similarity_score = Column(Float, nullable=True)
    matched_skills = Column(JSON, nullable=False, default=list)
    missing_skills = Column(JSON, nullable=False, default=list)
    embedding_model = Column(String(128), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    resume = relationship('Resume', back_populates='job_matches')
    job = relationship('Job', back_populates='job_matches')

    __table_args__ = (
        UniqueConstraint('resume_id', 'job_id', name='uq_job_matches_resume_job'),
        CheckConstraint('match_score >= 0 AND match_score <= 100', name='ck_job_matches_score_range'),
    )


class Application(Base):
    __tablename__ = 'applications'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    job_id = Column(Integer, ForeignKey('jobs.id', ondelete='SET NULL'), nullable=True)
    status = Column(String(64), nullable=False, default='pending')
    applied_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    notes = Column(Text, nullable=True)

    user = relationship('User', back_populates='applications')
    job = relationship('Job', back_populates='applications')


class InterviewSession(Base):
    __tablename__ = 'interview_sessions'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    resume_id = Column(Integer, ForeignKey('resumes.id', ondelete='SET NULL'), nullable=True)
    target_role = Column(String(255), nullable=True)
    status = Column(String(64), nullable=False, default='pending')
    questions = Column(JSON, nullable=False, default=list)
    answers = Column(JSON, nullable=False, default=list)
    feedback = Column(JSON, nullable=False, default=list)
    score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship('User', back_populates='interview_sessions')
    resume = relationship('Resume', back_populates='interview_sessions')

    __table_args__ = (
        CheckConstraint('score IS NULL OR (score >= 0 AND score <= 100)', name='ck_interview_sessions_score_range'),
    )


class CareerRoadmap(Base):
    __tablename__ = 'career_roadmaps'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    resume_id = Column(Integer, ForeignKey('resumes.id', ondelete='SET NULL'), nullable=True)
    target_role = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey('career_roles.id', ondelete='SET NULL'), nullable=True)
    roadmap = Column(JSON, nullable=False, default=list)
    missing_skills = Column(JSON, nullable=False, default=list)
    recommended_skills = Column(JSON, nullable=False, default=list)
    status = Column(String(64), nullable=False, default='draft')
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship('User', back_populates='career_roadmaps')
    resume = relationship('Resume', back_populates='career_roadmaps')
    role = relationship('CareerRole', back_populates='roadmaps')

    __table_args__ = (
        CheckConstraint("char_length(trim(target_role)) > 0", name='ck_career_roadmaps_target_role_not_blank'),
    )


class CareerRole(Base):
    __tablename__ = 'career_roles'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)

    skills = relationship('CareerRoleSkill', back_populates='role', cascade='all, delete-orphan')
    roadmaps = relationship('CareerRoadmap', back_populates='role')


class CareerRoleSkill(Base):
    __tablename__ = 'career_role_skills'

    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey('career_roles.id', ondelete='CASCADE'), nullable=False)
    skill_name = Column(String(128), nullable=False)
    required = Column(Boolean, nullable=False, default=True)

    role = relationship('CareerRole', back_populates='skills')

    __table_args__ = (
        UniqueConstraint('role_id', 'skill_name', name='uq_career_role_skills_role_skill'),
    )
