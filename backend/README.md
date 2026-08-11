# CareerLens Backend

## Overview
This backend is built with FastAPI, SQLAlchemy, PostgreSQL, and JWT-based authentication.

## Setup
1. Create a `.env` file in `backend/` using `.env.example`.
2. Install dependencies in a Python virtualenv.
3. Run the app with `uvicorn main:app --reload --host 0.0.0.0 --port 8000`.

## Environment Variables
- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `JWT_ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `FRONTEND_URL`
- `UPLOAD_DIR`

## API Routes
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/users/me`
- `PUT /api/v1/users/me`
- `GET /api/v1/users/me/dashboard`
- `POST /api/v1/resumes/upload`
- `GET /api/v1/resumes`
- `GET /api/v1/resumes/{id}`
- `GET /api/v1/resumes/{id}/analysis`
- `POST /api/v1/matching/analyze`
- `GET /api/v1/matching/jobs`
- `POST /api/v1/career/analyze`
- `POST /api/v1/career/roadmap`
- `POST /api/v1/interview/start`
- `POST /api/v1/interview/evaluate`
- `GET /api/v1/interview/{session_id}`

## Testing
Run `pytest tests` after installing dependencies.
