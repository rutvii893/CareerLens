from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class Token(BaseModel):
    access_token: str
    token_type: str = 'bearer'


class TokenPayload(BaseModel):
    sub: str
    exp: datetime


class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    email: EmailStr
    role: str = Field('student', min_length=3, max_length=32)


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=128)
    email: Optional[EmailStr] = None
    target_role: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[str] = None
    custom_skills: Optional[List[str]] = None
    preferences: Optional[dict] = None


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: str
    target_role: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[str] = None
    custom_skills: List[str] = []
    preferences: dict = {}
    created_at: datetime
    updated_at: datetime


class CustomSkillCreate(BaseModel):
    skill_name: str = Field(..., min_length=1, max_length=128)


class SkillsResponse(BaseModel):
    extracted_skills: List[str] = []
    custom_skills: List[str] = []
    all_skills: List[str] = []
    categorized_skills: dict = {}
    target_role: Optional[str] = None
    role_matching_skills: List[str] = []
    role_missing_skills: List[str] = []
    role_readiness_score: float = 0.0


class ResumeBase(BaseModel):
    filename: str
    status: str


class ResumeRead(ResumeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    file_path: str
    uploaded_at: datetime
    active: bool
    extracted_text: Optional[str] = None


class ATSResultRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    resume_id: int
    overall_score: Optional[float] = None
    keyword_score: Optional[float] = None
    missing_keywords: List[str] = []
    extracted_skills: List[str] = []
    missing_skills: List[str] = []
    recommended_skills: List[str] = []
    recommendations: List[str] = []
    section_analysis: dict = {}
    embedding_model: Optional[str] = None
    created_at: datetime


class DashboardMetrics(BaseModel):
    readiness_score: float = 0.0
    recent_ats_score: float = 0.0
    active_resume_id: Optional[int] = None
    active_resume_filename: Optional[str] = None
    extracted_skills: List[str] = []
    total_skills_count: int = 0
    resume_improvement: List[str] = []
    job_match_percentage: float = 0.0
    matching_skills: List[str] = []
    missing_skills: List[str] = []
    recommended_jobs: List[dict] = []
    career_skill_gap: List[str] = []
    roadmap_progress: dict = {}
    interview_performance: dict = {}
    career_readiness_overview: dict = {}
    saved_jobs_count: int = 0
    applications_count: int = 0
    recent_applications: List[dict] = []
    recent_interviews: List[dict] = []
    recent_activity: List[dict] = []


class ResumeAnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    overall_score: float = 0.0
    keyword_score: float = 0.0
    missing_keywords: List[str] = []
    extracted_skills: List[str] = []
    missing_skills: List[str] = []
    recommended_skills: List[str] = []
    recommendations: List[str] = []
    section_analysis: dict = {}
    embedding_model: Optional[str] = None


class ResumeUploadResponse(BaseModel):
    id: int
    filename: str
    status: str


class MatchingRequest(BaseModel):
    resume_id: int
    job_description: Optional[str] = None
    job_id: Optional[int] = None


class JobCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    company: Optional[str] = Field(None, max_length=255)
    description: str = Field(..., min_length=20)
    location: Optional[str] = Field(None, max_length=128)


class JobRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    company: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    required_skills: List[str] = []
    posted_at: datetime


class JobMatchRead(BaseModel):
    job: JobRead
    match_score: float
    similarity_score: Optional[float] = None
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    embedding_model: Optional[str] = None


class AdzunaJobItem(BaseModel):
    id: str
    title: str
    company: str
    location: str
    description: str
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    formatted_salary: str
    salary_is_predicted: bool = False
    job_type: str = 'Full-time'
    category: Optional[str] = None
    redirect_url: str
    created: str
    match_score: float = 0.0
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    source: str = 'adzuna'


class AdzunaJobSearchResponse(BaseModel):
    results: List[AdzunaJobItem] = []
    total_count: int = 0
    page: int = 1
    results_per_page: int = 10
    total_pages: int = 1
    country: str = 'in'
    personalized: bool = False
    user_skills_used: List[str] = []


class SavedJobCreate(BaseModel):
    job_id: Optional[int] = None
    job_title: str
    company: Optional[str] = None
    location: Optional[str] = None
    redirect_url: Optional[str] = None
    salary: Optional[str] = None
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    match_score: Optional[float] = None
    status: str = 'saved'
    notes: Optional[str] = None


class SavedJobRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    job_id: Optional[int] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    redirect_url: Optional[str] = None
    salary: Optional[str] = None
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    match_score: Optional[float] = None
    status: str
    applied_at: datetime
    notes: Optional[str] = None


class ApplicationStatusUpdate(BaseModel):
    status: str = Field(..., pattern='^(saved|applied|interviewing|offer|rejected)$')
    notes: Optional[str] = None


class MatchingResponse(BaseModel):
    match_score: float
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    similarity_score: Optional[float] = None
    embedding_model: Optional[str] = None


class CareerAnalyzeRequest(BaseModel):
    resume_id: Optional[int] = None
    target_role: str = Field(..., min_length=2, max_length=255)
    role_id: Optional[int] = None


class CareerRoleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str] = None
    required_skills: List[str] = []


class CareerRoleCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    required_skills: List[str] = Field(..., min_length=1)


class CareerAnalysisResponse(BaseModel):
    role: CareerRoleRead
    resume_id: Optional[int] = None
    current_skills: List[str] = []
    missing_skills: List[str] = []
    recommended_skills: List[str] = []
    similarity_score: Optional[float] = None
    embedding_model: Optional[str] = None


class CareerRoadmapResponse(BaseModel):
    id: Optional[int] = None
    role: Optional[CareerRoleRead] = None
    target_role: Optional[str] = None
    resume_id: Optional[int] = None
    missing_skills: List[str] = []
    recommended_skills: List[str] = []
    roadmap: List[dict] = []
    completed_phases: int = 0
    total_phases: int = 0
    progress_percentage: float = 0.0
    status: str = 'draft'


class RoadmapPhaseUpdate(BaseModel):
    status: str = Field(..., pattern='^(ready|in_progress|completed)$')


class InterviewStartRequest(BaseModel):
    resume_id: Optional[int] = None
    target_role: str = Field(..., min_length=2, max_length=255)
    interview_type: str = Field('Mixed', min_length=2, max_length=32)


class InterviewEvaluateRequest(BaseModel):
    session_id: int
    question_id: int
    answer_text: str = Field(..., min_length=1, max_length=10000)


class InterviewEvaluationResponse(BaseModel):
    session_id: int
    question_id: int
    score: float
    strengths: List[str] = []
    missing_points: List[str] = []
    improvement_feedback: List[str] = []


class CareerCoachRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=4000)
    resume_id: Optional[int] = None
    target_role: Optional[str] = Field(None, min_length=2, max_length=255)


class CareerCoachResponse(BaseModel):
    answer: str
    provider: str
    target_role: Optional[str] = None
    resume_id: Optional[int] = None
    current_skills: List[str] = []
    missing_skills: List[str] = []
    roadmap: List[dict] = []


class InterviewSessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    resume_id: Optional[int] = None
    target_role: Optional[str] = None
    status: str
    questions: List[dict] = []
    answers: List[dict] = []
    feedback: List[dict] = []
    score: Optional[float] = None
    created_at: datetime
    updated_at: datetime
