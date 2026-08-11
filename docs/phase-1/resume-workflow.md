# Resume Workflow

## Step 1: Upload & Validation
- **Action**: User uploads a file (PDF/DOCX) via the frontend.
- **Validation**: Frontend checks file size (e.g., <5MB) and type.
- **API Call**: `POST /api/v1/resumes/upload`

## Step 2: Extraction (Backend/NLP)
- **Action**: The backend receives the file and triggers the extraction pipeline.
- **Libraries**: PyMuPDF for PDF, python-docx for DOCX.
- **Processing**: 
  - Text is extracted.
  - NLP (spaCy) segments text into sections (Experience, Education, Skills, Projects).
  - Entities (Skills, Dates, Job Titles, Degrees) are extracted using NER.

## Step 3: Analysis & Scoring
- **Action**: The structured data is passed to the ATS scoring engine.
- **Processing**:
  - The deterministic scoring model applies weights to structure, formatting, and extracted content.
  - LLM (Gemini) is invoked selectively to evaluate the quality of bullet points or specific context matching.
- **Output**: A JSON object containing the `overall_score`, sub-scores, and `recommendations`.

## Step 4: Storage
- **Action**: Original file is stored locally (or cloud storage later).
- **Database**: 
  - A `Resume` record is created (with file path and extracted text).
  - A `ResumeAnalysis` record is created containing the scoring breakdown.

## Step 5: Presentation (Frontend)
- **Action**: The frontend polls or waits for the response, then redirects the user to the Analysis Dashboard.
- **Display**: The UI visualizes the ATS breakdown, highlights missing keywords, and presents actionable improvement steps.
