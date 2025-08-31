from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from ..database import get_db
from ..models.user import User
from ..models.session import Session
from ..schemas.users import PreferencesUpdate, DislikeUpdate, HistoryResponse, SessionItem
from .auth import get_current_user

router = APIRouter()

@router.put("/preferences")
async def update_preferences(body: PreferencesUpdate, db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    current.preferences = body.preferences
    db.add(current)
    await db.commit()
    return {"status": "ok", "message": "Preference saved"}

@router.put("/dislikes")
async def update_dislikes(body: DislikeUpdate, db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    dislikes = current.dislikes or {}
    if body.action == "add":
        dislikes[body.place_id] = {"name": body.name}
    elif body.action == "remove":
        dislikes.pop(body.place_id, None)
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    current.dislikes = dislikes
    db.add(current)
    await db.commit()
    return {"status": "ok", "message": "Updated"}

@router.get("/history", response_model=HistoryResponse)
async def user_history(db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    result = await db.execute(select(Session).where(Session.user_id == current.id).order_by(Session.created_at.desc()))
    rows = result.scalars().all()
    sessions = [SessionItem(id=s.id, title=s.title, stops=s.stops) for s in rows]
    return {"sessions": sessions}

@router.delete("/memory/reset")
async def reset_memory(db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    current.preferences = {}
    current.dislikes = {}
    db.add(current)
    await db.commit()
    await db.execute(delete(Session).where(Session.user_id == current.id))
    await db.commit()
    return {"status": "ok", "message": "Memory reset"}
