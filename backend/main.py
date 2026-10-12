# CareerLens Application Entrypoint
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import sys
from pathlib import Path

# If executed directly without package context (e.g. `uvicorn main:app` inside backend/)
if __package__ is None or __package__ == "":
    parent_dir = Path(__file__).resolve().parent.parent
    if str(parent_dir) not in sys.path:
        sys.path.insert(0, str(parent_dir))
    __package__ = "backend"

from contextlib import asynccontextmanager
from . import models
from .config import settings
from .database import SessionLocal, engine, ensure_db_defaults, ensure_interview_columns
from .routers import auth, users, resumes, matching, career, interview, jobs, generated_resumes
from .services.career_intelligence import ensure_default_roles


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Safe, fast idempotent startup checks
    try:
        models.Base.metadata.create_all(bind=engine)
        ensure_interview_columns()
        ensure_db_defaults()
        with SessionLocal() as startup_db:
            ensure_default_roles(startup_db)
    except Exception as exc:
        print(f"[CareerLens Backend] Startup check warning: {exc}")
    yield


app = FastAPI(title='CareerLens Backend', version='0.1.0', lifespan=lifespan)

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
app.include_router(generated_resumes.router, prefix='/api/v1')

@app.get('/')
def root():
    return {'status': 'ok'}
