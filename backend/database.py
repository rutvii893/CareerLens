from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

engine = create_engine(str(settings.database_url), echo=False, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()


def ensure_resume_analysis_columns() -> None:
	"""Add analysis columns to databases created before resume intelligence."""
	columns = {column['name'] for column in inspect(engine).get_columns('ats_results')}
	additions = {
		'extracted_skills': "ALTER TABLE ats_results ADD COLUMN extracted_skills JSON NOT NULL DEFAULT '[]'::json",
		'missing_skills': "ALTER TABLE ats_results ADD COLUMN missing_skills JSON NOT NULL DEFAULT '[]'::json",
		'recommended_skills': "ALTER TABLE ats_results ADD COLUMN recommended_skills JSON NOT NULL DEFAULT '[]'::json",
		'section_analysis': "ALTER TABLE ats_results ADD COLUMN section_analysis JSON NOT NULL DEFAULT '{}'::json",
		'embedding': "ALTER TABLE ats_results ADD COLUMN embedding JSON",
		'embedding_model': "ALTER TABLE ats_results ADD COLUMN embedding_model VARCHAR(128)",
	}
	missing = [(name, statement) for name, statement in additions.items() if name not in columns]
	if not missing:
		return
	with engine.begin() as connection:
		for _, statement in missing:
			connection.execute(text(statement))
