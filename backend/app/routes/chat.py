import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from app.services.chatbot import process_user_query, get_chat_history, clear_chat_history
from app.security import get_optional_current_user

logger = logging.getLogger("trademind.routes.chat")
router = APIRouter(prefix="/chat", tags=["AI Copilot Chatbot"])

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    email: Optional[str] = "demo@trademind.ai"

@router.post("/message")
async def send_chat_message(
    req: ChatRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """
    Submits a message to TradeMind AI Copilot.
    Processes intent, executes live market data tools when stocks are queried,
    and returns an explainable answer with MongoDB persistence.
    """
    user_email = (current_user.get("email") if current_user else req.email) or "demo@trademind.ai"
    try:
        result = await process_user_query(req.message, user_email)
        return result
    except Exception as e:
        logger.error(f"Error handling chat message: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chatbot failed to process message: {str(e)}"
        )

@router.get("/history/{email}")
async def get_history(
    email: str,
    limit: int = 40,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """Retrieves conversation history for user from MongoDB."""
    user_email = (current_user.get("email") if current_user else email) or email
    history = await get_chat_history(user_email, limit)
    return {"history": history, "count": len(history)}

@router.delete("/history/{email}")
async def clear_history(
    email: str,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """Clears conversation history for user."""
    user_email = (current_user.get("email") if current_user else email) or email
    await clear_chat_history(user_email)
    return {"success": True, "message": "Conversation history cleared."}
