from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
from ..services.chat_handler import ChatHandler
from ..services.foursquare_service import FoursquareService
import uuid

router = APIRouter()
chat_handler = ChatHandler()
foursquare = FoursquareService()

class ChatMessage(BaseModel):
    message: str
    user_id: Optional[str] = None
    location: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    response: str
    user_id: str
    user_info: Dict[str, Any]

class LocationInfo(BaseModel):
    lat: float
    lon: float
    name: Optional[str] = None

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(chat_message: ChatMessage):
    """
    Main chat endpoint that handles both personal and travel queries
    """
    try:
        # Generate user ID if not provided
        user_id = chat_message.user_id or str(uuid.uuid4())
        
        # Validate location
        if not chat_message.location:
            raise HTTPException(status_code=400, detail="Location information is required")
        
        location = chat_message.location
        if not isinstance(location.get("lat"), (int, float)) or not isinstance(location.get("lon"), (int, float)):
            raise HTTPException(status_code=400, detail="Invalid location coordinates")
        
        # Process message through chat handler
        response = await chat_handler.process_message(
            user_id=user_id,
            message=chat_message.message,
            user_location=location
        )
        
        # Get updated user info
        user_info = chat_handler.get_user_info(user_id)
        
        return ChatResponse(
            response=response,
            user_id=user_id,
            user_info=user_info
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Chat endpoint error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/chat/user/{user_id}")
async def get_user_info(user_id: str):
    """
    Get user information and conversation history
    """
    try:
        user_info = chat_handler.get_user_info(user_id)
        return {"user_id": user_id, "user_info": user_info}
    except Exception as e:
        print(f"Get user info error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/chat/user/{user_id}")
async def clear_user_conversation(user_id: str):
    """
    Clear conversation history for a user
    """
    try:
        chat_handler.clear_conversation(user_id)
        return {"message": "Conversation cleared successfully", "user_id": user_id}
    except Exception as e:
        print(f"Clear conversation error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/chat/health")
async def chat_health_check():
    """
    Health check endpoint for chat service
    """
    return {
        "status": "healthy",
        "service": "chat",
        "timestamp": "2025-01-01T00:00:00Z"
    }
