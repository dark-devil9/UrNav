from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from ..database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=False)
    preferences = Column(JSONB, nullable=True)
    dislikes = Column(JSONB, nullable=True)
    location_awareness = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
