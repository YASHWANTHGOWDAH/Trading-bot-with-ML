import logging
from typing import Optional
from fastapi import APIRouter, Query, HTTPException, status
from app.services.market_data import (
    SUPPORTED_STOCKS,
    SYMBOL_MAP,
    get_stock_quote,
    get_historical_ohlcv,
    get_market_overview
)

logger = logging.getLogger("trademind.routes.market")
router = APIRouter(prefix="/market", tags=["Market Data"])

@router.get("/symbols")
async def get_symbols():
    """Returns list of supported stock tickers with metadata."""
    return {"symbols": SUPPORTED_STOCKS}

@router.get("/overview")
async def get_overview():
    """Returns quotes and signals for all stocks in the universe."""
    data = await get_market_overview()
    return {"stocks": data}

@router.get("/{symbol}")
@router.get("/{symbol}/summary")
async def get_symbol_summary(symbol: str):
    """Returns real-time quote, today's price change, and latest indicators for a symbol."""
    sym = symbol.upper()
    try:
        quote = await get_stock_quote(sym)
        return quote
    except Exception as e:
        logger.error(f"Error fetching quote for {sym}: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unable to retrieve quote for symbol '{sym}'"
        )

@router.get("/{symbol}/history")
async def get_history(
    symbol: str,
    timeframe: str = Query("1M", pattern="^(1D|1W|1M|3M|6M|1Y)$"),
    refresh: bool = False
):
    """
    Returns historical OHLCV candle records enriched with technical indicators
    (SMA20, SMA50, RSI, MACD) formatted for Recharts visualization.
    """
    sym = symbol.upper()
    try:
        df = await get_historical_ohlcv(sym, timeframe=timeframe, force_refresh=refresh)
        records = df.to_dict(orient="records")
        return {
            "symbol": sym,
            "timeframe": timeframe,
            "total_bars": len(records),
            "candles": records
        }
    except Exception as e:
        logger.error(f"Error fetching historical data for {sym}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate historical candle data for '{sym}'"
        )
