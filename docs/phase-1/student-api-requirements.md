# Student API Requirements

These endpoints define the expected contract between the React frontend and the FastAPI backend for the student user journey.

## 1. Authentication (`/api/v1/auth`)
- `POST /register`: Accepts `name`, `email`, `password`, `role`. Returns standard success/failure.
- `POST /login`: Accepts `email`, `password`. Returns JWT token and minimal user data.

## 2. User Profile (`/api/v1/users`)
- `GET /me`: Fetch the logged-in student's profile details.
- `PUT /me`: Update personal information.
- `GET /me/dashboard`: Fetch aggregated dashboard metrics (Readiness score, latest ATS score, recent job matches, etc.).

## 3. Resumes (`/api/v1/resumes`)
- `POST /upload`: Multipart form data (file). Returns `resume_id` and initial processing status.
- `GET /`: List all uploaded resumes for the user.
- `GET /{id}`: Get details of a specific resume.
- `GET /{id}/analysis`: Get the detailed ATS scoring breakdown for a specific resume.

## 4. Job Matching (`/api/v1/matching`)
- `POST /analyze`: Accepts `resume_id` and either a `job_id` (from the platform) or `job_description` text. Returns the match score, matched skills, and missing skills.

## 5. Career Coach (`/api/v1/career`)
- `POST /analyze`: Accepts `resume_id` and `target_role`. Returns skill gap analysis.
- `POST /roadmap`: Accepts `resume_id` and `target_role` (or uses previous analysis). Returns the structured learning roadmap.

## 6. Interview Coach (`/api/v1/interview`)
- `POST /start`: Accepts `resume_id` and `target_role` or `job_description`. Returns a session ID and list of generated questions.
- `POST /evaluate`: Accepts `session_id`, `question_id`, and `answer_text`. Returns grading, feedback, and correct approach.
- `GET /{session_id}`: Get the complete results of a finished interview session.
