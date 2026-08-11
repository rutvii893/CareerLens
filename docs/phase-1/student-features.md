# Student Features Specification

## 1. Authentication
- Secure login and registration using JWT.
- Role-based access control ensuring students cannot access recruiter features.

## 2. Resume Management
- Upload PDF and DOCX formats.
- View history of uploaded resumes.
- Set an "active" resume for matching and coaching.

## 3. ATS Analysis
- Calculate an overall ATS score based on:
  - 25% Keyword Match
  - 20% Required Skills Match
  - 15% Resume Structure
  - 15% Experience Relevance
  - 10% Education Relevance
  - 10% Job Description Similarity
  - 5% Formatting/Readability
- Display missing keywords and actionable formatting/content improvement suggestions.

## 4. Job Description (JD) Matching
- Input a custom JD or select an internal job posting.
- Calculate a semantic match score between the active resume and the JD.
- Highlight exact matched skills and extract missing skills necessary for the role.

## 5. Career Coaching & Skill Gap
- Input a target career role.
- Compare current extracted skills with industry-standard skills for the target role.
- Output a personalized, step-by-step learning roadmap segmented by months/weeks.

## 6. AI Interview Prep
- Generate tailored interview questions based on the candidate's resume and target role.
- Support Technical, DSA, Project-based, Behavioral, and HR categories.
- Grade answers based on predefined rubrics (Relevance, Accuracy, Completeness).

## 7. Career Readiness Score
- An aggregated score from 0-100 indicating overall employability.
- Weighted heavily on Resume Quality, ATS Compatibility, Required Skills, Projects, Technical Prep, and Interview Performance.
