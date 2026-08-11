# Student User Flow

## 1. Onboarding Flow
1. User lands on the **Home** page.
2. Clicks "Sign Up".
3. Redirected to **Register** page.
4. Enters Name, Email, Password, and selects "Student" role.
5. Successfully registers and is redirected to **Login**.
6. Logs in and receives a JWT token.
7. Redirected to the **Student Dashboard** (initially empty state).

## 2. Resume Evaluation Flow
1. User navigates to **Resume Upload** from the dashboard.
2. User uploads a PDF/DOCX file.
3. System parses the resume and runs the ATS algorithm in the background.
4. User is redirected to **Resume Analysis** page.
5. User reviews the ATS score breakdown, missing skills, and improvement suggestions.
6. User can choose to update their resume offline and re-upload, or proceed to matching.

## 3. Job Matching Flow
1. User navigates to **Job Matching**.
2. User pastes a Job Description (JD) or selects a job from the internal board.
3. System compares the active parsed resume against the JD.
4. User views the Match Score, matched skills, and missing skills required for that specific JD.

## 4. Career Planning Flow
1. User navigates to **Career Coach**.
2. User selects a Target Role (e.g., Software Developer).
3. System analyzes current resume skills vs. target role required skills.
4. User views the Skill Gap Analysis.
5. User navigates to **Career Roadmap**.
6. System generates a month-by-month learning roadmap.
7. User can track their progress through the roadmap.

## 5. Interview Preparation Flow
1. User navigates to **Interview Coach**.
2. User selects a target role or specific JD.
3. System generates technical, behavioral, and project-based questions.
4. User answers questions (via text or future audio implementation).
5. System evaluates the answer and provides feedback on relevance, technical accuracy, and completeness.
