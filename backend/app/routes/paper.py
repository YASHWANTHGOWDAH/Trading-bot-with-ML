import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from app.services.portfolio import execute_trade, calculate_live_portfolio, reset_user_portfolio
from app.services.signal_engine import get_collection
from app.security import get_optional_current_user

logger = logging.getLogger("trademind.routes.paper")
router = APIRouter(prefix="/paper", tags=["Paper Trading"])

class TradeRequest(BaseModel):
    symbol: str
    action: str = Field(..., pattern="^(BUY|SELL|buy|sell)$")
    quantity: int = Field(..., gt=0)
    email: Optional[str] = None

@router.post("/trade")
async def place_paper_trade(
    req: TradeRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """
    Executes a virtual paper trade:
    - Validates cash/shares
    - Deducts/credits virtual capital
    - Updates holdings and weighted average price
    - Logs trade record in MongoDB trades collection
    """
    user_email = (current_user.get("email") if current_user else req.email)
    if not user_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User email is required to execute a paper trade."
        )
    user_email = user_email.lower().strip()
    
    # Fetch current signal if available for trade ledger context
    signals_col = get_collection("signals")
    signal_doc = await signals_col.find_one({"symbol": req.symbol.upper()})
    
    res = await execute_trade(
        user_email=user_email,
        symbol=req.symbol.upper(),
        action=req.action.upper(),
        quantity=req.quantity,
        signal_info=signal_doc
    )
    return res

@router.get("/portfolio/{email}")
async def get_paper_portfolio(email: str):
    """Returns real-time paper trading portfolio valuation, holdings, and P/L."""
    clean_email = email.lower().strip()
    portfolio = await calculate_live_portfolio(clean_email)
    return portfolio

@router.get("/history/{email}")
async def get_trade_history(email: str, limit: int = 50):
    """Returns chronological ledger of executed paper trades from MongoDB."""
    clean_email = email.lower().strip()
    trades_col = get_collection("trades")
    cursor = trades_col.find({"user_email": clean_email}).sort("timestamp", -1).limit(limit)
    
    trades = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        if "timestamp" in doc and hasattr(doc["timestamp"], "isoformat"):
            doc["timestamp"] = doc["timestamp"].isoformat()
        trades.append(doc)
        
    return {"trades": trades, "count": len(trades)}

@router.get("/holdings/{email}")
async def get_user_holdings(email: str):
    """Returns user's open stock positions."""
    clean_email = email.lower().strip()
    portfolio = await calculate_live_portfolio(clean_email)
    return {"holdings": portfolio.get("holdings", [])}
