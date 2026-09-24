from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

engine = create_engine(str(settings.database_url), echo=False, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()


def ensure_resume_analysis_columns() -> None:
	"""Add Phase 3/4 columns to databases created before intelligence features."""
	additions = {
		'ats_results': {
			'extracted_skills': "ALTER TABLE ats_results ADD COLUMN extracted_skills JSON NOT NULL DEFAULT '[]'::json",
			'missing_skills': "ALTER TABLE ats_results ADD COLUMN missing_skills JSON NOT NULL DEFAULT '[]'::json",
			'recommended_skills': "ALTER TABLE ats_results ADD COLUMN recommended_skills JSON NOT NULL DEFAULT '[]'::json",
			'section_analysis': "ALTER TABLE ats_results ADD COLUMN section_analysis JSON NOT NULL DEFAULT '{}'::json",
			'embedding': "ALTER TABLE ats_results ADD COLUMN embedding JSON",
			'embedding_model': "ALTER TABLE ats_results ADD COLUMN embedding_model VARCHAR(128)",
		},
		'jobs': {
			'owner_user_id': "ALTER TABLE jobs ADD COLUMN owner_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL",
			'required_skills': "ALTER TABLE jobs ADD COLUMN required_skills JSON NOT NULL DEFAULT '[]'::json",
			'embedding': "ALTER TABLE jobs ADD COLUMN embedding JSON",
			'embedding_model': "ALTER TABLE jobs ADD COLUMN embedding_model VARCHAR(128)",
		},
		'job_matches': {
			'similarity_score': "ALTER TABLE job_matches ADD COLUMN similarity_score FLOAT",
			'embedding_model': "ALTER TABLE job_matches ADD COLUMN embedding_model VARCHAR(128)",
		},
		'career_roadmaps': {
			'role_id': "ALTER TABLE career_roadmaps ADD COLUMN role_id INTEGER REFERENCES career_roles(id) ON DELETE SET NULL",
			'missing_skills': "ALTER TABLE career_roadmaps ADD COLUMN missing_skills JSON NOT NULL DEFAULT '[]'::json",
			'recommended_skills': "ALTER TABLE career_roadmaps ADD COLUMN recommended_skills JSON NOT NULL DEFAULT '[]'::json",
		},
	}
	with engine.begin() as connection:
		for table, table_additions in additions.items():
			columns = {column['name'] for column in inspect(engine).get_columns(table)}
			for name, statement in table_additions.items():
				if name not in columns:
					connection.execute(text(statement))
