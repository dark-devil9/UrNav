from pydantic import BaseModel, EmailStr
from typing import Optional, Any

class SignupRequest(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: str

class LoginRequest(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: str

class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class UserProfile(BaseModel):
    id: int
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    preferences: Optional[Any] = None
    dislikes: Optional[Any] = None
    location_awareness: bool

    class Config:
        from_attributes = True
