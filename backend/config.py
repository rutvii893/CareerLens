from pathlib import Path
from typing import Optional

from pydantic import Field, PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    database_url: PostgresDsn = 'postgresql://postgres:abtr@localhost:5432/careerlens'
    jwt_secret_key: str = 'a61aea93866c065cd93ea12a0a772e92882dd2e4f1f8d42af16a97c210c09b2a'
    jwt_algorithm: str = 'HS256'
    access_token_expire_minutes: int = 30
    frontend_url: str = 'http://localhost:5173'
    upload_dir: str = 'uploads'
    gemini_api_key: Optional[str] = None
    gemini_model: str = 'gemini-2.0-flash'
    adzuna_app_id: Optional[str] = None
    adzuna_app_key: Optional[str] = None
    adzuna_country: str = 'in'

    model_config = SettingsConfigDict(env_file=BASE_DIR / '.env', env_file_encoding='utf-8', extra='ignore')


settings = Settings()
