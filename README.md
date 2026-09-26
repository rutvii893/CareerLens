# CareerLens 🎯

**CareerLens** is an end-to-end intelligent career navigation platform. It provides automated resume ATS diagnostics, live job search via Adzuna with skill-overlap scoring, application tracking, personalized career learning roadmaps with interactive milestone tracking, mock technical/behavioral interview practice with scoring feedback, and an AI Career Coach.

---

## 🌟 Key Features

### 1. 📊 Career Readiness Dashboard
- **Real-Time Composite Readiness Score**: Dynamically calculated from your active resume ATS score, job matching overlap, career skill gap, roadmap completion percentage, and mock interview average.
- **Traceable Metrics**: Transparent breakdown of ATS keywords, detected skills, active applications, and interview performance.
- **Chronological Activity Feed**: Displays your latest analyzed resumes, tracked job applications, and completed interview prep sessions.

### 2. 📑 Resume Intelligence & ATS Diagnostics
- **Multi-Format Document Parsing**: High-performance extraction for both `.pdf` and `.docx` formats.
- **Dual Scoring Model**:
  - **General Resume Quality Score**: Structural audit analyzing summary, experience, education, skills, and project sections.
  - **Job-Specific ATS Match**: Live comparator allowing users to test their resume against any custom job description.
- **Actionable Feedback**: Pinpoints missing section headings, skill keywords, and formatting recommendations.

### 3. 🧩 My Skills & Competency Matrix
- **Automated Skill Cataloging**: Automatically extracts programming languages, frameworks, cloud/databases, and developer tools.
- **Manual Custom Skills Management**: Add or remove specialized competencies with instant database persistence.
- **Target Role Gap Analysis**: Side-by-side comparison of current skills vs. target career requirements.

### 4. 💼 Live Adzuna Job Search & Application Tracker
- **Real-Time Job Vacancies**: Direct integration with the official Adzuna Job Search API with keyword, location, country, and salary filters.
- **Personalized Skill Match Score**: Transparent percentage calculation against your resume skills.
- **1-Click Save Job & Application Tracker**: Track application stages (`Saved`, `Applied`, `Interviewing`, `Offer Received`, `Archived`) with custom notes.

### 5. 🗺️ Career Milestone Roadmap
- **Personalized Learning Paths**: Generates phased milestones tailored to close your specific skill gaps.
- **Interactive Phase Completion**: Check off completed learning milestones with live progress tracking and persistent database state.

### 6. 🎙️ Interview Preparation & Instant AI Scoring
- **Dynamic Question Generation**: Generates role-relevant technical and behavioral questions based on your profile skills and selected target role.
- **Detailed Evaluation Feedback**: Scores answers out of 100 with identified strengths, missing points, and suggestions.
- **Session History**: Revisit previous practice sessions and track score improvements over time.

### 7. 🤖 AI Career Coach
- **Context-Aware Assistance**: Uses your authenticated resume details, detected skills, target role, and roadmap to provide actionable career advice.
- **Multi-Provider Support**: Powered by Google Gemini AI with intelligent deterministic fallback.
- **Prompt Suggestions**: 1-click prompt chips for rapid guidance on resume improvements, portfolio projects, and interview strategies.

### 8. 👤 Profile & Preference Management
- **Full Profile Editing**: Manage name, email, target role, location, education, experience, and bio.
- **Profile Strength Indicator**: Visual completeness meter.
- **Custom Search Preferences**: Configure default job search country and automation toggles.

---

## 🏗️ System Architecture & Tech Stack

```
CareerLens/
├── backend/                  # FastAPI (Python 3.10+)
│   ├── routers/              # Modular API routes (auth, users, resumes, jobs, career, interview)
│   ├── services/             # Core business logic (adzuna, resume_intelligence, gemini, interview)
│   ├── models.py             # SQLAlchemy ORM models
│   ├── schemas.py            # Pydantic validation schemas
│   ├── database.py           # PostgreSQL engine & automatic schema sync
│   └── tests/                # Automated pytest suite (17 tests)
└── frontend/                 # React 18 + Vite + Tailwind CSS
    ├── src/pages/            # Dashboard, Skills, Jobs, Coach, Roadmap, Interview, Profile, Settings
    ├── src/components/       # Layout, Navbar, GlassCard, Common UI components
    └── src/services/         # Axios API clients
```

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Axios.
- **Backend**: FastAPI, Python 3.10+, SQLAlchemy, Pydantic v2, native `bcrypt`.
- **Database**: PostgreSQL (with SQLite in-memory test compatibility).
- **Authentication**: JWT Bearer Token auth with bcrypt password hashing.
- **External Integrations**: Adzuna Job Search API, Google Gemini AI.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher & npm
- PostgreSQL database instance

---

### Backend Setup

1. **Navigate to the backend directory and activate the virtual environment**:
   ```powershell
   cd backend
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and provide your credentials:
   ```env
   DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/careerlens
   SECRET_KEY=your_secure_jwt_secret_key
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440

   # Adzuna Job Search API (Get free keys at https://developer.adzuna.com/)
   ADZUNA_APP_ID=your_adzuna_app_id
   ADZUNA_APP_KEY=your_adzuna_app_key
   ADZUNA_COUNTRY=in

   # Optional Gemini AI Key
   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_MODEL=gemini-1.5-flash
   ```

3. **Start the FastAPI server**:
   ```powershell
   python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload-dir backend --reload-exclude "backend/venv/*"
   ```
   *The API will be available at [http://localhost:8000](http://localhost:8000) (Interactive Swagger Docs at `/docs`).*

---

### Frontend Setup

1. **Navigate to the frontend directory and install dependencies**:
   ```powershell
   cd frontend
   npm install
   ```

2. **Start the Vite development server**:
   ```powershell
   npm run dev
   ```
   *Open [http://localhost:5173](http://localhost:5173) in your browser.*

---

## 🧪 Testing & Verification

### Run Backend Tests
```powershell
.\backend\venv\Scripts\pytest backend/tests
```
*(All 17 integration and unit tests covering auth, resumes, Adzuna jobs, roadmap progress, interview practice, and skills management pass with 100%).*

### Run Frontend Production Build
```powershell
cd frontend
npm run build
```

---

## 📡 API Endpoint Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | User registration |
| `POST` | `/api/v1/auth/login` | JWT token authentication |
| `GET` | `/api/v1/users/me` | Fetch current user profile |
| `PUT` | `/api/v1/users/me` | Update user profile details |
| `GET` | `/api/v1/users/me/dashboard` | Aggregated real-time metrics and activity feed |
| `GET` | `/api/v1/users/me/skills` | Categorized skills breakdown & target role gap |
| `POST` | `/api/v1/users/me/skills` | Add user custom skill |
| `DELETE` | `/api/v1/users/me/skills/{name}` | Remove custom skill |
| `POST` | `/api/v1/resumes/upload` | Upload and analyze PDF/DOCX resume |
| `GET` | `/api/v1/resumes/{id}/analysis` | Get resume ATS score and section audit |
| `GET` | `/api/v1/jobs/search` | Search live Adzuna vacancies with resume match |
| `POST` | `/api/v1/jobs/save` | Save job to user application tracker |
| `GET` | `/api/v1/jobs/saved` | List tracked applications and saved jobs |
| `PATCH` | `/api/v1/jobs/saved/{id}/status` | Update application status (`saved`, `applied`, etc.) |
| `DELETE` | `/api/v1/jobs/saved/{id}` | Delete saved job |
| `POST` | `/api/v1/career/roadmap` | Generate phased learning roadmap |
| `GET` | `/api/v1/career/roadmap` | Fetch latest user roadmap |
| `PATCH` | `/api/v1/career/roadmap/{id}/phase/{idx}` | Update milestone phase completion status |
| `POST` | `/api/v1/career/coach/ask` | Career Coach AI Q&A |
| `POST` | `/api/v1/interview/start` | Start mock interview session |
| `POST` | `/api/v1/interview/evaluate` | Submit answer for evaluation and scoring |
| `GET` | `/api/v1/interview/sessions` | List user interview history |

---

## 🛡️ License
MIT License. Built with ❤️ for career acceleration.