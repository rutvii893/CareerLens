from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

DATABASE_URL = str(settings.database_url)

engine = create_engine(DATABASE_URL, echo=False, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()


def ensure_interview_columns() -> None:
    sync_database_schema()


def sync_database_schema() -> None:
    insp = inspect(engine)
    tables = insp.get_table_names()

    with engine.begin() as connection:
        if 'users' in tables:
            cols = {c['name'] for c in insp.get_columns('users')}
            if 'target_role' not in cols:
                connection.execute(text("ALTER TABLE users ADD COLUMN target_role VARCHAR(255) NULL"))
            if 'location' not in cols:
                connection.execute(text("ALTER TABLE users ADD COLUMN location VARCHAR(128) NULL"))
            if 'bio' not in cols:
                connection.execute(text("ALTER TABLE users ADD COLUMN bio TEXT NULL"))
            if 'education' not in cols:
                connection.execute(text("ALTER TABLE users ADD COLUMN education VARCHAR(255) NULL"))
            if 'experience' not in cols:
                connection.execute(text("ALTER TABLE users ADD COLUMN experience VARCHAR(255) NULL"))
            if 'custom_skills' not in cols:
                connection.execute(text("ALTER TABLE users ADD COLUMN custom_skills JSON NOT NULL DEFAULT '[]'::json"))
            if 'preferences' not in cols:
                connection.execute(text("ALTER TABLE users ADD COLUMN preferences JSON NOT NULL DEFAULT '{}'::json"))

        if 'ats_results' in tables:
            cols = {c['name'] for c in insp.get_columns('ats_results')}
            if 'extracted_skills' not in cols:
                connection.execute(text("ALTER TABLE ats_results ADD COLUMN extracted_skills JSON NOT NULL DEFAULT '[]'::json"))
            if 'missing_skills' not in cols:
                connection.execute(text("ALTER TABLE ats_results ADD COLUMN missing_skills JSON NOT NULL DEFAULT '[]'::json"))
            if 'recommended_skills' not in cols:
                connection.execute(text("ALTER TABLE ats_results ADD COLUMN recommended_skills JSON NOT NULL DEFAULT '[]'::json"))
            if 'section_analysis' not in cols:
                connection.execute(text("ALTER TABLE ats_results ADD COLUMN section_analysis JSON NOT NULL DEFAULT '{}'::json"))
            if 'embedding' not in cols:
                connection.execute(text("ALTER TABLE ats_results ADD COLUMN embedding JSON NULL"))
            if 'embedding_model' not in cols:
                connection.execute(text("ALTER TABLE ats_results ADD COLUMN embedding_model VARCHAR(128) NULL"))

        if 'jobs' in tables:
            cols = {c['name'] for c in insp.get_columns('jobs')}
            if 'owner_user_id' not in cols:
                connection.execute(text("ALTER TABLE jobs ADD COLUMN owner_user_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL"))
            if 'required_skills' not in cols:
                connection.execute(text("ALTER TABLE jobs ADD COLUMN required_skills JSON NOT NULL DEFAULT '[]'::json"))
            if 'embedding' not in cols:
                connection.execute(text("ALTER TABLE jobs ADD COLUMN embedding JSON NULL"))
            if 'embedding_model' not in cols:
                connection.execute(text("ALTER TABLE jobs ADD COLUMN embedding_model VARCHAR(128) NULL"))

        if 'interview_sessions' in tables:
            cols = {c['name'] for c in insp.get_columns('interview_sessions')}
            if 'answers' not in cols:
                connection.execute(text("ALTER TABLE interview_sessions ADD COLUMN answers JSON NOT NULL DEFAULT '[]'::json"))

        if 'applications' in tables:
            cols = {c['name'] for c in insp.get_columns('applications')}
            if 'job_title' not in cols:
                connection.execute(text("ALTER TABLE applications ADD COLUMN job_title VARCHAR(255) NULL"))
            if 'company' not in cols:
                connection.execute(text("ALTER TABLE applications ADD COLUMN company VARCHAR(255) NULL"))
            if 'location' not in cols:
                connection.execute(text("ALTER TABLE applications ADD COLUMN location VARCHAR(128) NULL"))
            if 'redirect_url' not in cols:
                connection.execute(text("ALTER TABLE applications ADD COLUMN redirect_url TEXT NULL"))
            if 'salary' not in cols:
                connection.execute(text("ALTER TABLE applications ADD COLUMN salary VARCHAR(128) NULL"))
            if 'matched_skills' not in cols:
                connection.execute(text("ALTER TABLE applications ADD COLUMN matched_skills JSON NOT NULL DEFAULT '[]'::json"))
            if 'missing_skills' not in cols:
                connection.execute(text("ALTER TABLE applications ADD COLUMN missing_skills JSON NOT NULL DEFAULT '[]'::json"))
            if 'match_score' not in cols:
                connection.execute(text("ALTER TABLE applications ADD COLUMN match_score FLOAT NULL"))


def ensure_db_defaults() -> None:
    tables = inspect(engine).get_table_names()
    statements = []
    if 'users' in tables:
        statements.extend([
            "ALTER TABLE users ALTER COLUMN created_at SET DEFAULT now()",
            "ALTER TABLE users ALTER COLUMN updated_at SET DEFAULT now()",
        ])
    if 'resumes' in tables:
        statements.append("ALTER TABLE resumes ALTER COLUMN uploaded_at SET DEFAULT now()")
    if 'ats_results' in tables:
        statements.append("ALTER TABLE ats_results ALTER COLUMN created_at SET DEFAULT now()")
    if 'jobs' in tables:
        statements.append("ALTER TABLE jobs ALTER COLUMN posted_at SET DEFAULT now()")
    if 'job_matches' in tables:
        statements.append("ALTER TABLE job_matches ALTER COLUMN created_at SET DEFAULT now()")
    if 'applications' in tables:
        statements.append("ALTER TABLE applications ALTER COLUMN applied_at SET DEFAULT now()")
    if 'interview_sessions' in tables:
        statements.extend([
            "ALTER TABLE interview_sessions ALTER COLUMN created_at SET DEFAULT now()",
            "ALTER TABLE interview_sessions ALTER COLUMN updated_at SET DEFAULT now()",
        ])
    if 'career_roadmaps' in tables:
        statements.extend([
            "ALTER TABLE career_roadmaps ALTER COLUMN created_at SET DEFAULT now()",
            "ALTER TABLE career_roadmaps ALTER COLUMN updated_at SET DEFAULT now()",
        ])
    with engine.begin() as connection:
        for stmt in statements:
            try:
                connection.execute(text(stmt))
            except Exception:
                pass


