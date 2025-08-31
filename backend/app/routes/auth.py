from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError
from ..database import get_db
from ..models.user import User
from ..schemas.auth import SignupRequest, LoginRequest, TokenPair, UserProfile
from ..services.auth_service import hash_password, verify_password, create_token_pair
from ..config import settings

router = APIRouter()

async def get_current_user(db: AsyncSession = Depends(get_db), authorization: str | None = Header(None)) -> User:
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        scheme, token = authorization.split(" ", 1)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid auth header")
    if scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid scheme")
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_optional_user(db: AsyncSession = Depends(get_db), authorization: str | None = Header(None)) -> User | None:
    if not authorization:
        return None
    try:
        scheme, token = authorization.split(" ", 1)
        if scheme.lower() != "bearer":
            return None
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = int(payload.get("sub"))
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()
    except Exception:
        return None

@router.post("/signup", response_model=TokenPair)
async def signup(body: SignupRequest, db: AsyncSession = Depends(get_db)):
    if not body.email and not body.phone:
        raise HTTPException(status_code=400, detail="Email or phone required")

    # Only check for fields that are provided to avoid matching rows with NULLs
    if body.email:
        existing_email = await db.execute(select(User).where(User.email == body.email))
        if existing_email.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="User already exists")
    if body.phone:
        existing_phone = await db.execute(select(User).where(User.phone == body.phone))
        if existing_phone.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="User already exists")

    user = User(
        email=body.email,
        phone=body.phone,
        password_hash=hash_password(body.password),
        preferences={},
        dislikes={},
    )
    db.add(user)
    try:
        await db.commit()
    except Exception:
        # Handle potential race condition on unique constraints
        await db.rollback()
        raise HTTPException(status_code=400, detail="User already exists")
    await db.refresh(user)
    access, refresh = create_token_pair(user.id)
    return TokenPair(access_token=access, refresh_token=refresh)

@router.post("/login", response_model=TokenPair)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    if not body.email and not body.phone:
        raise HTTPException(status_code=400, detail="Email or phone required")
    query = select(User)
    if body.email:
        query = query.where(User.email == body.email)
    else:
        query = query.where(User.phone == body.phone)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access, refresh = create_token_pair(user.id)
    return TokenPair(access_token=access, refresh_token=refresh)

@router.get("/me", response_model=UserProfile)
async def me(current: User = Depends(get_current_user)):
    return current
