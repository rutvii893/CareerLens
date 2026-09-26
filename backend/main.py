# CareerLens Application Entrypoint
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .config import settings
from .database import SessionLocal, engine, ensure_db_defaults, ensure_interview_columns
from .routers import auth, users, resumes, matching, career, interview, jobs
from .services.career_intelligence import ensure_default_roles

models.Base.metadata.create_all(bind=engine)
ensure_interview_columns()
ensure_db_defaults()

with SessionLocal() as startup_db:
    ensure_default_roles(startup_db)

app = FastAPI(title='CareerLens Backend', version='0.1.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ],
    allow_origin_regex=r'^https?://(localhost|127\.0\.0\.1)(:\d+)?$',
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(auth.router, prefix='/api/v1')
app.include_router(users.router, prefix='/api/v1')
app.include_router(resumes.router, prefix='/api/v1')
app.include_router(matching.router, prefix='/api/v1')
app.include_router(career.router, prefix='/api/v1')
app.include_router(interview.router, prefix='/api/v1')
app.include_router(jobs.router, prefix='/api/v1')

@app.get('/')
def root():
    return {'status': 'ok'}
