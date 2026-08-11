from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


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
    id: int
    name: str
    email: EmailStr
    role: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class ResumeBase(BaseModel):
    filename: str
    status: str


class ResumeRead(ResumeBase):
    id: int
    user_id: int
    file_path: str
    uploaded_at: datetime
    active: bool
    extracted_text: Optional[str]

    class Config:
        orm_mode = True


class ATSResultRead(BaseModel):
    id: int
    resume_id: int
    overall_score: Optional[float]
    keyword_score: Optional[float]
    missing_keywords: List[str] = []
    recommendations: List[str] = []
    created_at: datetime

    class Config:
        orm_mode = True


class DashboardMetrics(BaseModel):
    readiness_score: float = 0.0
    recent_ats_score: float = 0.0
    active_resume_id: Optional[int] = None
    recent_applications: List[dict] = []
    recent_interviews: List[dict] = []


class ResumeAnalysisResponse(BaseModel):
    overall_score: float = 0.0
    keyword_score: float = 0.0
    missing_keywords: List[str] = []
    recommendations: List[str] = []


class ResumeUploadResponse(BaseModel):
    id: int
    filename: str
    status: str


class MatchingRequest(BaseModel):
    resume_id: int
    job_description: Optional[str] = None
    job_id: Optional[int] = None


class MatchingResponse(BaseModel):
    match_score: float
    matched_skills: List[str] = []
    missing_skills: List[str] = []


class CareerAnalyzeRequest(BaseModel):
    resume_id: int
    target_role: str


class CareerRoadmapResponse(BaseModel):
    roadmap: List[dict] = []


class InterviewStartRequest(BaseModel):
    resume_id: int
    target_role: str


class InterviewEvaluateRequest(BaseModel):
    session_id: int
    question_id: int
    answer_text: str


class InterviewSessionRead(BaseModel):
    id: int
    user_id: int
    resume_id: Optional[int]
    target_role: Optional[str]
    status: str
    questions: List[dict] = []
    score: Optional[float]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
