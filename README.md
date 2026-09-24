# CareerLens

CareerLens is a student-focused career platform for resume intelligence, job matching, career skill-gap analysis, and learning roadmaps. It contains a React frontend and a FastAPI backend backed by PostgreSQL.

## Project Overview

The implemented workflow is:

1. A user registers and signs in with JWT authentication.
2. The user uploads a PDF or DOCX resume.
3. The backend extracts and cleans resume text, detects skills and sections, calculates an ATS score, and stores the analysis.
4. Job descriptions can be stored, skill-tagged, and compared with a user's resume.
5. A user selects a career role, reviews missing skills, and generates a stored roadmap.
6. The dashboard aggregates the persisted resume, job, career, roadmap, and interview signals.
7. The user can ask the career coach questions and complete structured interview sessions.

## Current Implemented Features

- JWT authentication and bcrypt password hashing.
- Authenticated user profile and dashboard endpoints.
- Per-user PDF and DOCX resume uploads and resume retrieval.
- Resume text extraction and cleaning.
- Deterministic skill extraction from the shared skill catalog.
- Resume section and keyword analysis.
- ATS scoring, missing skills, recommended skills, and improvement suggestions.
- Optional Sentence Transformer embeddings and cosine similarity.
- PostgreSQL persistence for resume analyses, jobs, job skills, job matches, career roles, role skills, and roadmaps.
- Job description creation and resume-to-job matching.
- Career role selection, skill-gap analysis, and personalized roadmap generation.
- AI career coach integration through a backend-only Gemini service with deterministic fallback.
- Role-based interview question generation, structured answer evaluation, and PostgreSQL persistence.
- PostgreSQL-backed dashboard readiness, resume, job, career, roadmap, and interview metrics.
- React pages connected to real auth, resume, job, career, coach, interview, skills, and dashboard APIs.
- Backend integration tests and frontend production build validation.

## Resume Intelligence

The resume upload flow accepts PDF and DOCX files, stores them under the configured `UPLOAD_DIR`, and analyzes the extracted text. Analysis results include:

- Cleaned resume text stored on the resume record.
- Detected skills from the shared catalog.
- Presence and scores for summary, experience, education, skills, and projects sections.
- Section-based keyword coverage.
- Overall ATS score and keyword score.
- Missing keywords, missing skills, recommended skills, and actionable suggestions.
- Optional embedding and embedding model metadata.

The implementation is in `backend/services/resume_intelligence.py`; routers only coordinate validation, ownership, persistence, and service calls.

## ML/NLP Pipeline

The current pipeline is intentionally deterministic where possible:

1. Extract text with `pypdf` or `python-docx`.
2. Normalize whitespace, null characters, and blank lines.
3. Detect known sections with heading aliases.
4. Detect skills using case-insensitive catalog matching.
5. Calculate section, keyword, content, and overall ATS scores.
6. Attempt to generate a normalized `all-MiniLM-L6-v2` embedding.

Sentence Transformers is optional at runtime. It is declared in `backend/requirements.txt`, but if the package or model is unavailable, embedding fields remain empty and deterministic skill-based scoring continues to work. Gemini is available only through the backend career-coach service and requires `GEMINI_API_KEY`; without it, the coach returns a context-aware deterministic fallback. No model training is implemented.

## Job Intelligence

Job descriptions can be stored through `POST /api/v1/matching/jobs`. The backend cleans the description, extracts required skills, stores normalized job skills, and optionally stores a job embedding.

For a user's resume, the matching service:

- Compares detected resume skills with required job skills.
- Reports matching and missing skills.
- Calculates a match percentage from skill coverage.
- Uses cosine similarity as an additional score component when both embeddings are available.
- Stores the result in PostgreSQL and updates an existing resume/job match when repeated.

## Semantic Resume-Job Matching

When Sentence Transformers is available, resume and job-description embeddings use the same `all-MiniLM-L6-v2` model. Cosine similarity contributes to the final match percentage alongside deterministic skill coverage. Without the model, the match percentage falls back to required-skill coverage only.

## Skill Gap Detection

Career analysis compares extracted resume skills with the selected role's required skills. It returns current skills, missing skills, recommended skills, and an optional semantic similarity score. The comparison is ownership-checked against the authenticated user's resume.

## Career Intelligence

Career role profiles are stored in PostgreSQL with normalized required skills. The application seeds these profiles on startup when absent:

- Backend Engineer
- Frontend Engineer
- Product Designer

Additional profiles can be created through the career roles API. Role matching is deterministic by default and can include optional embedding similarity.

## Career Roadmap

The roadmap service groups missing skills into ordered phases and stores the result with the authenticated user, resume, and selected role. Saved roadmaps can be retrieved later for the same user and resume. Roadmap completion tracking is not implemented yet.

## AI Career Coach and Interview Intelligence

The career coach accepts a question and builds context from the authenticated user's actual resume, extracted skills, target role, recorded skill gaps, and stored roadmap. Gemini calls are made only by the backend; the API key is never sent to React. When Gemini is unavailable, the response uses the available CareerLens context and identifies the fallback provider.

Interview sessions generate technical and behavioral questions from the user's resume and target role. Submitted answers are evaluated against structured expected points and stored with score, strengths, missing points, and improvement feedback.

## Final Dashboard

`GET /api/v1/users/me/dashboard` aggregates the latest authenticated user's ATS score, resume improvement, job matching, career gaps, roadmap progress, interview performance, recommended jobs, and readiness component scores.

## PostgreSQL Data Persistence

SQLAlchemy models currently cover:

- `User`
- `Resume`
- `ResumeAnalysis` / `ats_results`
- `Job`
- `JobSkill`
- `JobMatch`
- `Application`
- `InterviewSession`
- interview answers and feedback stored as JSON on `InterviewSession`
- `CareerRole`
- `CareerRoleSkill`
- `CareerRoadmap`

Tables are created at application startup. Compatibility column additions for intelligence fields are also handled at startup. There is currently no Alembic migration system.

## Frontend/Backend Architecture

- `frontend/` contains the React/Vite client, route pages, shared components, and Axios services.
- `backend/main.py` creates the FastAPI application, configures CORS, creates tables, seeds default roles, and registers routers.
- `backend/routers/` contains HTTP endpoints and ownership validation.
- `backend/services/` contains resume, job, and career intelligence logic.
- `backend/models.py` contains SQLAlchemy persistence models.
- `backend/schemas.py` contains Pydantic request and response contracts.
- `backend/crud.py` contains database operations.

## API Overview

Protected endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/` | Backend health response |
| POST | `/api/v1/auth/register` | Register a user |
| POST | `/api/v1/auth/login` | Issue a JWT |
| GET | `/api/v1/users/me` | Get the authenticated user |
| PUT | `/api/v1/users/me` | Update name or email |
| GET | `/api/v1/users/me/dashboard` | Get dashboard metrics |
| POST | `/api/v1/resumes/upload` | Upload and analyze a PDF/DOCX resume |
| GET | `/api/v1/resumes/` | List the user's resumes |
| GET | `/api/v1/resumes/{resume_id}` | Get a user's resume |
| GET | `/api/v1/resumes/{resume_id}/analysis` | Get stored resume intelligence |
| POST | `/api/v1/matching/jobs` | Store and analyze a job description |
| POST | `/api/v1/matching/analyze` | Match a resume to a job or custom description |
| GET | `/api/v1/matching/jobs?resumeId={id}` | Get and persist matches for a resume |
| GET | `/api/v1/career/roles` | List available career roles |
| POST | `/api/v1/career/roles` | Create a career role profile |
| POST | `/api/v1/career/analyze` | Analyze resume skills against a role |
| POST | `/api/v1/career/roadmap` | Generate and store a roadmap |
| GET | `/api/v1/career/roadmap?resumeId={id}` | Retrieve the latest stored roadmap |
| POST | `/api/v1/career/coach/ask` | Ask a context-aware career question |
| POST | `/api/v1/interview/start` | Generate and create an interview session |
| POST | `/api/v1/interview/evaluate` | Evaluate and store an interview answer |
| GET | `/api/v1/interview/{session_id}` | Get an interview session with answers and feedback |

## Project Structure

```text
CareerLens/
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── crud.py
│   ├── security.py
│   ├── dependencies.py
│   ├── routers/
│   ├── services/
│   │   ├── resume_intelligence.py
│   │   ├── job_intelligence.py
│   │   ├── career_intelligence.py
│   │   ├── career_coach.py
│   │   ├── gemini_service.py
│   │   └── interview_intelligence.py
│   └── tests/
├── frontend/
│   ├── src/App.jsx
│   ├── src/pages/
│   ├── src/components/
│   └── src/services/
└── docs/phase-1/
```

## Setup and Run Instructions

### Prerequisites

- Python compatible with `backend/requirements.txt`.
- Node.js and npm.
- PostgreSQL with a `careerlens` database.

### Backend

From the repository root:

```powershell
python -m venv backend\.venv
backend\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
```

Create `backend/.env` from `backend/.env.example`, configure PostgreSQL, and start the API:

```powershell
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

The frontend normally runs at `http://localhost:5173`.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL SQLAlchemy connection URL |
| `JWT_SECRET_KEY` | JWT signing secret |
| `JWT_ALGORITHM` | JWT algorithm, normally `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT lifetime in minutes |
| `FRONTEND_URL` | Allowed CORS origin |
| `UPLOAD_DIR` | Local resume storage directory |
| `GEMINI_API_KEY` | Optional backend-only Gemini API key |
| `GEMINI_MODEL` | Gemini model name; defaults to `gemini-2.0-flash` |

### Frontend (`frontend/.env`)

`VITE_API_BASE_URL` optionally overrides the default `http://localhost:8000/api/v1` API URL.

## Testing Status

From the repository root:

```powershell
$env:PYTHONPATH = (Get-Location).Path
backend\.venv\Scripts\python.exe -m pytest backend/tests -q
```

The current backend suite covers authentication, protected user access, resume intelligence, authenticated resume upload and analysis, job matching, career gap analysis, roadmap persistence, dashboard aggregation, interview intelligence, and career-coach fallback behavior. The latest run passed 8 tests.

The frontend production build is verified with:

```powershell
cd frontend
npm run build
```

## Known Limitations

- Sentence Transformer embeddings require the declared dependency and a locally available/downloadable model; otherwise deterministic skill matching is used.
- Gemini coaching requires `GEMINI_API_KEY`; deterministic context-aware fallback is used when it is absent or unavailable.
- ATS scoring is deterministic and catalog-based; it is not an LLM or industry-certified ATS implementation.
- Skill extraction only recognizes the maintained catalog in `resume_intelligence.py`.
- Job listings are user-created or seeded database records; external job-board ingestion is not implemented.
- Interview evaluation is structured and deterministic; it is not an LLM-based grading system.
- Application workflows, roadmap completion tracking, active-resume selection, and role-based authorization are incomplete.
- Database schema setup uses startup table creation and compatibility alterations; Alembic migrations are not implemented.
- Resume files are stored locally under `UPLOAD_DIR`; cloud object storage and production file scanning are not implemented.

## Future Improvements

- Add Alembic migrations and production database lifecycle management.
- Expand and version the skill catalog and role profiles.
- Add active-resume selection and roadmap progress tracking.
- Add external job ingestion and search filters.
- Improve PDF/DOCX parsing for tables, columns, and richer resume structures.
- Add background processing for large files and embedding generation.
- Add interview question generation and answer evaluation when that feature is intentionally scoped.
- Add production storage, file scanning, observability, rate limiting, and role-based authorization.