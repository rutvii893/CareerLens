# Student Requirements & Frontend Planning

## 1. High-Level Goals
The student side of CareerLens provides a comprehensive platform for candidates to:
- Evaluate and improve their resumes via AI-driven ATS scoring.
- Identify skill gaps for their target roles.
- Follow personalized career roadmaps.
- Practice and receive feedback on interviews.

## 2. Required Frontend Pages

### 1. Home
- **Purpose**: Landing page introducing CareerLens.
- **Main UI Sections**: Hero banner, features overview, call-to-action (CTA), footer.
- **User Actions**: Click to Login/Register.
- **Data Required**: Static marketing copy.
- **API Requirements**: None.
- **Components Required**: `Hero`, `FeatureCard`, `Footer`, `Navbar`.
- **Expected Output**: Engaging marketing page.

### 2. Login
- **Purpose**: User authentication.
- **Main UI Sections**: Login form (email, password), "Forgot Password" link.
- **User Actions**: Submit credentials.
- **Data Required**: Email, password state.
- **API Requirements**: `POST /api/v1/auth/login`
- **Components Required**: `AuthForm`, `InputField`, `Button`.
- **Expected Output**: JWT token on success, redirection to Dashboard.

### 3. Register
- **Purpose**: New student onboarding.
- **Main UI Sections**: Registration form (name, email, password, role selection).
- **User Actions**: Submit user details.
- **Data Required**: Name, email, password.
- **API Requirements**: `POST /api/v1/auth/register`
- **Components Required**: `AuthForm`, `InputField`, `Button`.
- **Expected Output**: Account created, redirection to Login or Dashboard.

### 4. Student Dashboard
- **Purpose**: Central hub for student's progress and stats.
- **Main UI Sections**: Overview widgets (ATS score, Readiness score), recommended jobs list, recent activities.
- **User Actions**: Navigate to specific tools (resume, interview, roadmap).
- **Data Required**: Latest ATS score, career readiness score, skill gap, recommended jobs, resume improvement suggestions, interview progress, roadmap progress.
- **API Requirements**: `GET /api/v1/users/me/dashboard`
- **Components Required**: `StatCard`, `ProgressRing`, `JobCard`, `Sidebar`.
- **Expected Output**: A complete overview of the student's current status.

### 5. Resume Upload
- **Purpose**: Upload resume (PDF/DOCX) for analysis.
- **Main UI Sections**: Drag-and-drop zone, file browser button, upload progress.
- **User Actions**: Select file, submit.
- **Data Required**: File object.
- **API Requirements**: `POST /api/v1/resumes/upload`
- **Components Required**: `FileUploader`, `ProgressBar`.
- **Expected Output**: Successful upload and redirection to Resume Analysis.

### 6. Resume Analysis
- **Purpose**: Detailed breakdown of the ATS score.
- **Main UI Sections**: Score breakdown charts, Missing Keywords, Missing Skills, Improvement Suggestions.
- **User Actions**: Review feedback, re-upload new version.
- **Data Required**: ATS score, Keyword score, Skills score, Experience score, Education score, missing keywords/skills, suggestions.
- **API Requirements**: `GET /api/v1/resumes/{id}/analysis`
- **Components Required**: `ScoreGauge`, `FeedbackList`, `Badge`.
- **Expected Output**: Actionable feedback to improve resume.

### 7. Job Matching
- **Purpose**: Compare current resume against specific job descriptions.
- **Main UI Sections**: Job description input/search, match score display, missing skills list.
- **User Actions**: Paste JD or select job, view match.
- **Data Required**: Match score, matched skills, missing skills, recommended skills, reason for match.
- **API Requirements**: `POST /api/v1/matching/analyze`
- **Components Required**: `MatchRing`, `SkillTagList`, `TextArea`.
- **Expected Output**: Semantic similarity and skill gap between resume and JD.

### 8. Career Coach
- **Purpose**: Provide target role recommendations and skill gap analysis.
- **Main UI Sections**: Target role selector, current vs. target skill comparison.
- **User Actions**: Select target role, view gaps.
- **Data Required**: Target role, current skills, missing skills.
- **API Requirements**: `POST /api/v1/career/analyze`
- **Components Required**: `RoleSelector`, `SkillGapChart`.
- **Expected Output**: Clear identification of skills needed for a target role.

### 9. Career Roadmap
- **Purpose**: Monthly/Weekly learning plan to bridge skill gaps.
- **Main UI Sections**: Timeline/Steppers of topics.
- **User Actions**: Mark topics as complete.
- **Data Required**: Roadmap milestones (e.g., Month 1: DSA + SQL).
- **API Requirements**: `POST /api/v1/career/roadmap` (or GET based on existing analysis).
- **Components Required**: `Timeline`, `TaskItem`.
- **Expected Output**: A structured learning path.

### 10. Interview Coach
- **Purpose**: Generate and evaluate mock interview questions.
- **Main UI Sections**: Question list, answer text area / audio recorder, feedback display.
- **User Actions**: Start interview, submit answer, view feedback.
- **Data Required**: Target role, question categories, generated questions, evaluation feedback.
- **API Requirements**: `POST /api/v1/interview/start`, `POST /api/v1/interview/evaluate`
- **Components Required**: `QuestionCard`, `AnswerInput`, `FeedbackModal`.
- **Expected Output**: Graded evaluation of the student's interview answers.

### 11. Profile
- **Purpose**: Manage account details and saved data.
- **Main UI Sections**: Personal info, saved resumes, account settings.
- **User Actions**: Update info, delete account, change password.
- **Data Required**: User profile object.
- **API Requirements**: `GET /api/v1/users/me`, `PUT /api/v1/users/me`
- **Components Required**: `ProfileForm`, `SettingsPanel`.
- **Expected Output**: Updated user preferences.
