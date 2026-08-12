from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String, Text, Float
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    email = Column(String(256), nullable=False, unique=True, index=True)
    hashed_password = Column(String(256), nullable=False)
    role = Column(String(32), nullable=False, default='student')
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    resumes = relationship('Resume', back_populates='user', cascade='all, delete-orphan')
    applications = relationship('Application', back_populates='user', cascade='all, delete-orphan')
    interview_sessions = relationship('InterviewSession', back_populates='user', cascade='all, delete-orphan')


class Resume(Base):
    __tablename__ = 'resumes'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    status = Column(String(64), nullable=False, default='uploaded')
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    extracted_text = Column(Text, nullable=True)
    active = Column(Boolean, default=False)

    user = relationship('User', back_populates='resumes')
    ats_results = relationship('ATSResult', back_populates='resume', cascade='all, delete-orphan')
    interview_sessions = relationship('InterviewSession', back_populates='resume')


class ATSResult(Base):
    __tablename__ = 'ats_results'

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey('resumes.id', ondelete='CASCADE'), nullable=False)
    overall_score = Column(Float, nullable=True)
    keyword_score = Column(Float, nullable=True)
    missing_keywords = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    resume = relationship('Resume', back_populates='ats_results')


class Job(Base):
    __tablename__ = 'jobs'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    location = Column(String(128), nullable=True)
    posted_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    applications = relationship('Application', back_populates='job', cascade='all, delete-orphan')


class Application(Base):
    __tablename__ = 'applications'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    job_id = Column(Integer, ForeignKey('jobs.id', ondelete='SET NULL'), nullable=True)
    status = Column(String(64), nullable=False, default='pending')
    applied_at = Column(DateTime, default=datetime.utcnow, nullable=False)
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
    questions = Column(Text, nullable=True)
    feedback = Column(Text, nullable=True)
    score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship('User', back_populates='interview_sessions')
    resume = relationship('Resume', back_populates='interview_sessions')
