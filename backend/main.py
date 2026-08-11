from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .config import settings
from .database import engine
from .routers import auth, users, resumes, matching, career, interview

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title='CareerLens Backend', version='0.1.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
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

@app.get('/')
def root():
    return {'status': 'ok'}
