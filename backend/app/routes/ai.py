import asyncio
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from app.services.market_data import get_historical_ohlcv, SUPPORTED_STOCKS
from app.services.signal_engine import generate_and_save_analysis
from app.database import get_collection

logger = logging.getLogger("trademind.routes.ai")
router = APIRouter(prefix="/ai", tags=["AI & Explainable Signals"])

@router.get("/analysis/{symbol}")
async def get_ai_analysis(symbol: str):
    """
    Executes ML inference, calculates technical indicators, synthesizes BUY/SELL/HOLD signal,
    confidence score, up/down probabilities, and explainable reason bullet points.
    Persists the prediction into MongoDB.
    """
    sym = symbol.upper()
    try:
        # Use 3M or 1M historical series for comprehensive feature engineering
        df = await get_historical_ohlcv(sym, timeframe="3M")
        analysis = await generate_and_save_analysis(sym, df)
        return analysis
    except Exception as e:
        logger.error(f"Error computing AI analysis for {sym}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate explainable AI analysis for '{sym}': {str(e)}"
        )

@router.get("/signal/{symbol}")
async def get_ai_signal_only(symbol: str):
    """Lightweight endpoint returning the latest BUY/SELL/HOLD signal and confidence for a stock."""
    sym = symbol.upper()
    signals_col = get_collection("signals")
    cached = await signals_col.find_one({"symbol": sym})
    if cached:
        cached["_id"] = str(cached["_id"])
        return cached
    
    # Otherwise run full analysis
    df = await get_historical_ohlcv(sym, timeframe="3M")
    analysis = await generate_and_save_analysis(sym, df)
    return analysis

@router.get("/signals/all")
async def get_all_signals():
    """Returns the latest signals for all supported stocks in the universe."""
    signals_col = get_collection("signals")
    all_signals = {}
    
    # Try fetching existing signals
    cursor = signals_col.find({})
    async for doc in cursor:
        sym = doc["symbol"]
        doc["_id"] = str(doc["_id"])
        all_signals[sym] = doc
        
    # For any missing symbols, generate them concurrently
    missing = [s["symbol"] for s in SUPPORTED_STOCKS if s["symbol"] not in all_signals]
    if missing:
        async def _gen(s_sym):
            try:
                df = await get_historical_ohlcv(s_sym, timeframe="3M")
                analysis = await generate_and_save_analysis(s_sym, df)
                return s_sym, analysis
            except Exception as e:
                logger.error(f"Error auto-generating signal for {s_sym}: {e}")
                return s_sym, None
                
        results = await asyncio.gather(*[_gen(m) for m in missing])
        for s_sym, analysis in results:
            if analysis:
                all_signals[s_sym] = analysis
                
    return {"signals": list(all_signals.values())}

@router.get("/predictions/history/{symbol}")
async def get_prediction_history(symbol: str, limit: int = 20):
    """Returns audit log of historical predictions generated for this stock."""
    sym = symbol.upper()
    pred_col = get_collection("predictions")
    cursor = pred_col.find({"symbol": sym}).sort("timestamp", -1).limit(limit)
    
    history = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        if "timestamp" in doc and hasattr(doc["timestamp"], "isoformat"):
            doc["timestamp"] = doc["timestamp"].isoformat()
        history.append(doc)
        
    return {"symbol": sym, "history": history}
