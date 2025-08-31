from datetime import datetime, timedelta, timezone
from jose import jwt
from passlib.context import CryptContext
from ..config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(subject: str, expires_minutes: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    to_encode = {"sub": subject, "exp": expire}
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def create_token_pair(user_id: int) -> tuple[str, str]:
    access = create_token(str(user_id), settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh = create_token(str(user_id), settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    return access, refresh
