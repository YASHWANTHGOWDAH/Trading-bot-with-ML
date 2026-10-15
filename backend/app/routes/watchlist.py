import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from app.database import get_collection
from app.security import get_optional_current_user
from app.services.market_data import get_stock_quote, SUPPORTED_STOCKS
from app.services.signal_engine import get_collection as get_col

logger = logging.getLogger("trademind.routes.watchlist")
router = APIRouter(prefix="/watchlist", tags=["Watchlist"])

class WatchlistAddRequest(BaseModel):
    symbol: str
    email: Optional[str] = None

DEFAULT_WATCHLIST = ["AAPL", "NVDA", "TSLA", "MSFT"]

@router.get("")
async def get_watchlist(
    email: Optional[str] = None,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """
    Returns user's watchlist with live price, 24h change %, and AI BUY/SELL/HOLD signal.
    If new user, initializes default symbols (AAPL, NVDA, TSLA, MSFT).
    """
    user_email = (current_user.get("email") if current_user else email) or "demo@trademind.ai"
    clean_email = user_email.lower().strip()
    
    col = get_collection("watchlists")
    user_items = await col.find({"user_email": clean_email}).to_list(50)
    
    symbols = [item["symbol"] for item in user_items]
    if not symbols:
        # Seed default watchlist
        symbols = DEFAULT_WATCHLIST
        for sym in symbols:
            await col.update_one(
                {"user_email": clean_email, "symbol": sym},
                {"$set": {"user_email": clean_email, "symbol": sym, "created_at": datetime.now(timezone.utc)}},
                upsert=True
            )
            
    # Enrich with live quotes and AI signals
    signals_col = get_collection("signals")
    enriched = []
    
    for sym in symbols:
        try:
            quote = await get_stock_quote(sym)
            signal_doc = await signals_col.find_one({"symbol": sym})
            
            signal = signal_doc.get("signal", "HOLD") if signal_doc else "HOLD"
            confidence = signal_doc.get("confidence", 50.0) if signal_doc else 50.0
            
            enriched.append({
                "symbol": sym,
                "name": quote.get("name", sym),
                "price": quote.get("current_price", 0.0),
                "change_percent": quote.get("change_percent", 0.0),
                "change_amount": quote.get("change_amount", 0.0),
                "currency": quote.get("currency", "₹"),
                "signal": signal,
                "confidence": confidence
            })
        except Exception as e:
            logger.warning(f"Error enriching watchlist item {sym}: {e}")
            
    return {"watchlist": enriched}

@router.post("")
async def add_to_watchlist(
    req: WatchlistAddRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """Adds a stock ticker to user's watchlist."""
    user_email = (current_user.get("email") if current_user else req.email) or "demo@trademind.ai"
    clean_email = user_email.lower().strip()
    sym = req.symbol.upper().strip()
    
    col = get_collection("watchlists")
    await col.update_one(
        {"user_email": clean_email, "symbol": sym},
        {"$set": {"user_email": clean_email, "symbol": sym, "created_at": datetime.now(timezone.utc)}},
        upsert=True
    )
    return {"success": True, "message": f"Added {sym} to watchlist"}

@router.delete("/{symbol}")
async def remove_from_watchlist(
    symbol: str,
    email: Optional[str] = None,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """Removes a stock ticker from user's watchlist."""
    user_email = (current_user.get("email") if current_user else email) or "demo@trademind.ai"
    clean_email = user_email.lower().strip()
    sym = symbol.upper().strip()
    
    col = get_collection("watchlists")
    res = await col.delete_one({"user_email": clean_email, "symbol": sym})
    return {"success": True, "message": f"Removed {sym} from watchlist", "deleted_count": res.deleted_count}
