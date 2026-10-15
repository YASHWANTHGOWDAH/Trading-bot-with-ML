import logging
from typing import Optional
from bson import ObjectId
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from app.services.backtesting import execute_and_save_backtest
from app.database import get_collection
from app.security import get_optional_current_user

logger = logging.getLogger("trademind.routes.backtest")
router = APIRouter(prefix="/backtest", tags=["Backtesting Lab"])

class BacktestRequest(BaseModel):
    symbol: str = "AAPL"
    strategy: str = "TradeMind AI ML-Ensemble Signal"
    timeframe: str = "6M"
    initial_capital: float = Field(default=100000.0, gt=0)
    email: Optional[str] = "demo@trademind.ai"

@router.post("")
async def run_backtest(
    req: BacktestRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """
    Executes a backtest over historical candle data:
    - Runs selected strategy (TradeMind AI ML, SMA Crossover, or RSI Momentum)
    - Computes final capital, total return %, win rate, drawdown
    - Returns portfolio equity curve and trade signal markers
    - Persists backtest run into MongoDB backtests collection
    """
    user_email = (current_user.get("email") if current_user else req.email) or "demo@trademind.ai"
    try:
        result = await execute_and_save_backtest(
            user_email=user_email,
            symbol=req.symbol.upper(),
            strategy=req.strategy,
            timeframe=req.timeframe,
            initial_capital=req.initial_capital
        )
        return result
    except Exception as e:
        logger.error(f"Error running backtest: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Backtesting execution failed: {str(e)}"
        )

@router.get("/{id}")
async def get_backtest_by_id(id: str):
    """Retrieves a previously executed backtest by MongoDB ID."""
    backtests_col = get_collection("backtests")
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid MongoDB ObjectId format.")
        
    doc = await backtests_col.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Backtest report not found.")
        
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    if "created_at" in doc and hasattr(doc["created_at"], "isoformat"):
        doc["created_at"] = doc["created_at"].isoformat()
    return doc

@router.get("/history/{email}")
async def get_backtest_history(email: str, limit: int = 15):
    """Returns past backtests executed by this user."""
    clean_email = email.lower().strip()
    backtests_col = get_collection("backtests")
    cursor = backtests_col.find({"user_email": clean_email}).sort("created_at", -1).limit(limit)
    
    reports = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        doc.pop("_id", None)
        if "created_at" in doc and hasattr(doc["created_at"], "isoformat"):
            doc["created_at"] = doc["created_at"].isoformat()
        # Exclude massive curve data in summary list
        doc.pop("equity_curve", None)
        doc.pop("trade_history", None)
        reports.append(doc)
        
    return {"reports": reports, "count": len(reports)}
