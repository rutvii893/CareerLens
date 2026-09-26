import bcrypt
from datetime import datetime, timedelta
from typing import Any

from jose import JWTError, jwt

from .config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pw_bytes = plain_password.encode('utf-8')
        if len(pw_bytes) > 72:
            pw_bytes = pw_bytes[:72]
        return bcrypt.checkpw(pw_bytes, hashed_password.encode('utf-8'))
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    pw_bytes = password.encode('utf-8')
    if len(pw_bytes) > 72:
        pw_bytes = pw_bytes[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pw_bytes, salt).decode('utf-8')



def create_access_token(subject: Any, expires_delta: timedelta | None = None) -> str:
    to_encode = {'sub': str(subject)}
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode.update({'exp': expire})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        subject = payload.get('sub')
        if subject is None:
            raise JWTError('Missing subject')
        return subject
    except JWTError as exc:
        raise
