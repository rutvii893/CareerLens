from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

engine = create_engine(str(settings.database_url), echo=False, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()


def ensure_interview_columns() -> None:
    if 'interview_sessions' not in inspect(engine).get_table_names():
        return
    columns = {column['name'] for column in inspect(engine).get_columns('interview_sessions')}
    if 'answers' in columns:
        return
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE interview_sessions ADD COLUMN answers JSON NOT NULL DEFAULT '[]'::json"))
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import settings


DATABASE_URL = str(settings.database_url)

engine = create_engine(
    DATABASE_URL,
    echo=False,
    future=True
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    future=True
)

Base = declarative_base()
