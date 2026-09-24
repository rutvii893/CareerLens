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
    email: Optional[EmailStr]


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: str
    created_at: datetime
    updated_at: datetime

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
    extracted_text: Optional[str]

class ATSResultRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    resume_id: int
    overall_score: Optional[float]
    keyword_score: Optional[float]
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
    recent_applications: List[dict] = []
    recent_interviews: List[dict] = []


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
    company: Optional[str]
    description: Optional[str]
    location: Optional[str]
    required_skills: List[str] = []
    posted_at: datetime


class JobMatchRead(BaseModel):
    job: JobRead
    match_score: float
    similarity_score: Optional[float] = None
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    embedding_model: Optional[str] = None


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
    description: Optional[str]
    required_skills: List[str] = []


class CareerRoleCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    required_skills: List[str] = Field(..., min_length=1)


class CareerAnalysisResponse(BaseModel):
    role: CareerRoleRead
    resume_id: Optional[int]
    current_skills: List[str] = []
    missing_skills: List[str] = []
    recommended_skills: List[str] = []
    similarity_score: Optional[float] = None
    embedding_model: Optional[str] = None


class CareerRoadmapResponse(BaseModel):
    id: Optional[int] = None
    role: Optional[CareerRoleRead] = None
    resume_id: Optional[int] = None
    missing_skills: List[str] = []
    recommended_skills: List[str] = []
    roadmap: List[dict] = []


class InterviewStartRequest(BaseModel):
    resume_id: int
    target_role: str


class InterviewEvaluateRequest(BaseModel):
    session_id: int
    question_id: int
    answer_text: str


class InterviewSessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    resume_id: Optional[int]
    target_role: Optional[str]
    status: str
    questions: List[dict] = []
    score: Optional[float]
    created_at: datetime
    updated_at: datetime

