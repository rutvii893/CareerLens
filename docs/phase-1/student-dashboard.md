# Student Dashboard Information Architecture

## 1. Overview
The Student Dashboard serves as the central hub for the candidate. It aggregates data from multiple modules to present a unified view of the candidate's career readiness and immediate action items.

## 2. Core Metrics (Top Row Widgets)
- **Career Readiness Score**: A large gauge or circular progress indicator showing the 0-100 score.
- **Latest ATS Score**: The overall score from the most recently analyzed active resume.
- **Skill Gap Summary**: A quick metric (e.g., "3 Missing Core Skills" for the target role).
- **Interview Performance**: Average score from recent AI mock interviews.

## 3. Main Content Sections

### A. Resume Improvement Suggestions
- Displays the top 3 high-priority actions based on the latest ATS analysis.
- E.g., "Add 2 more backend projects", "Include missing keyword: Docker".
- CTA: "View Full Analysis" or "Upload New Version".

### B. Career Roadmap Progress
- A mini-timeline or progress bar showing the current active learning roadmap.
- Displays the current month/week's focus (e.g., "Month 1: DSA + SQL - 50% Complete").
- CTA: "Continue Roadmap".

### C. Recommended Jobs
- A scrollable list or grid of 3-5 job cards that have the highest semantic match score with the active resume.
- Card contents: Job Title, Company, Match Score (e.g., 85%), "Apply" / "View Details" button.

### D. Interview Progress
- Recent mock interview sessions with their respective scores and target roles.
- CTA: "Start New Practice Session".

## 4. Navigation (Sidebar/Navbar)
- Home / Dashboard
- My Resumes (Upload & Analysis)
- Job Matches
- Career Coach (Gap & Roadmap)
- Interview Coach
- Profile / Settings
