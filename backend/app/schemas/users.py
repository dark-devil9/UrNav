from pydantic import BaseModel
from typing import Any, List, Optional

class PreferencesUpdate(BaseModel):
  preferences: Any

class DislikeUpdate(BaseModel):
  place_id: str
  name: Optional[str] = None
  action: str

class SessionItem(BaseModel):
  id: int
  title: str
  stops: Any

class HistoryResponse(BaseModel):
  sessions: List[SessionItem]
