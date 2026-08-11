from pydantic import BaseSettings, Field, PostgresDsn


class Settings(BaseSettings):
    database_url: PostgresDsn = Field('=postgresql://postgres:989876@localhost:5432/careerlens', env='DATABASE_URL')
    jwt_secret_key: str = Field('a61aea93866c065cd93ea12a0a772e92882dd2e4f1f8d42af16a97c210c09b2a', env='JWT_SECRET_KEY')
    jwt_algorithm: str = Field('HS256', env='JWT_ALGORITHM')
    access_token_expire_minutes: int = Field(30, env='ACCESS_TOKEN_EXPIRE_MINUTES')
    frontend_url: str = Field('http://localhost:5173', env='FRONTEND_URL')
    upload_dir: str = Field('uploads', env='UPLOAD_DIR')

    class Config:
        env_file = '.env'
        env_file_encoding = 'utf-8'


settings = Settings()
