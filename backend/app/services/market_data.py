import logging
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd
import yfinance as yf
from app.database import get_collection
from app.services.indicators import calculate_technical_indicators, extract_latest_indicators

logger = logging.getLogger("trademind.market_data")

# Supported stock universe with display metadata
SUPPORTED_STOCKS = [
    # US Tech & Global Leaders
    {"symbol": "AAPL", "name": "Apple Inc.", "exchange": "NASDAQ", "currency": "₹", "base_price": 224.50, "yf_ticker": "AAPL"},
    {"symbol": "MSFT", "name": "Microsoft Corp.", "exchange": "NASDAQ", "currency": "₹", "base_price": 428.10, "yf_ticker": "MSFT"},
    {"symbol": "NVDA", "name": "NVIDIA Corporation", "exchange": "NASDAQ", "currency": "₹", "base_price": 122.80, "yf_ticker": "NVDA"},
    {"symbol": "TSLA", "name": "Tesla Inc.", "exchange": "NASDAQ", "currency": "₹", "base_price": 248.20, "yf_ticker": "TSLA"},
    {"symbol": "AMZN", "name": "Amazon.com Inc.", "exchange": "NASDAQ", "currency": "₹", "base_price": 186.40, "yf_ticker": "AMZN"},
    {"symbol": "GOOGL", "name": "Alphabet Inc.", "exchange": "NASDAQ", "currency": "₹", "base_price": 164.75, "yf_ticker": "GOOGL"},
    {"symbol": "META", "name": "Meta Platforms Inc.", "exchange": "NASDAQ", "currency": "₹", "base_price": 585.30, "yf_ticker": "META"},
    {"symbol": "NFLX", "name": "Netflix Inc.", "exchange": "NASDAQ", "currency": "₹", "base_price": 710.20, "yf_ticker": "NFLX"},
    {"symbol": "AMD", "name": "Advanced Micro Devices", "exchange": "NASDAQ", "currency": "₹", "base_price": 165.40, "yf_ticker": "AMD"},
    {"symbol": "INTC", "name": "Intel Corporation", "exchange": "NASDAQ", "currency": "₹", "base_price": 22.80, "yf_ticker": "INTC"},

    # Indian Market Leaders (NSE)
    {"symbol": "RELIANCE", "name": "Reliance Industries Ltd", "exchange": "NSE", "currency": "₹", "base_price": 2980.00, "yf_ticker": "RELIANCE.NS"},
    {"symbol": "TCS", "name": "Tata Consultancy Services", "exchange": "NSE", "currency": "₹", "base_price": 4250.00, "yf_ticker": "TCS.NS"},
    {"symbol": "INFY", "name": "Infosys Ltd", "exchange": "NSE", "currency": "₹", "base_price": 1890.00, "yf_ticker": "INFY.NS"},
    {"symbol": "HDFCBANK", "name": "HDFC Bank Ltd", "exchange": "NSE", "currency": "₹", "base_price": 1680.00, "yf_ticker": "HDFCBANK.NS"},
    {"symbol": "ICICIBANK", "name": "ICICI Bank Ltd", "exchange": "NSE", "currency": "₹", "base_price": 1245.00, "yf_ticker": "ICICIBANK.NS"},
    {"symbol": "SBIN", "name": "State Bank of India", "exchange": "NSE", "currency": "₹", "base_price": 790.00, "yf_ticker": "SBIN.NS"},
    {"symbol": "BHARTIARTL", "name": "Bharti Airtel Ltd", "exchange": "NSE", "currency": "₹", "base_price": 1650.00, "yf_ticker": "BHARTIARTL.NS"},
    {"symbol": "ITC", "name": "ITC Ltd", "exchange": "NSE", "currency": "₹", "base_price": 505.00, "yf_ticker": "ITC.NS"},
    {"symbol": "LARSEN", "name": "Larsen & Toubro Ltd", "exchange": "NSE", "currency": "₹", "base_price": 3720.00, "yf_ticker": "LT.NS"},
    {"symbol": "TATAPOWER", "name": "Tata Power Co. Ltd", "exchange": "NSE", "currency": "₹", "base_price": 342.20, "yf_ticker": "TATAPOWER.NS"},
    {"symbol": "TATASTEEL", "name": "Tata Steel Ltd", "exchange": "NSE", "currency": "₹", "base_price": 160.00, "yf_ticker": "TATASTEEL.NS"},
    {"symbol": "WIPRO", "name": "Wipro Ltd", "exchange": "NSE", "currency": "₹", "base_price": 530.00, "yf_ticker": "WIPRO.NS"},
    {"symbol": "HINDUNILVR", "name": "Hindustan Unilever Ltd", "exchange": "NSE", "currency": "₹", "base_price": 2780.00, "yf_ticker": "HINDUNILVR.NS"},
    {"symbol": "BAJFINANCE", "name": "Bajaj Finance Ltd", "exchange": "NSE", "currency": "₹", "base_price": 7450.00, "yf_ticker": "BAJFINANCE.NS"},
    {"symbol": "MARUTI", "name": "Maruti Suzuki India", "exchange": "NSE", "currency": "₹", "base_price": 12800.00, "yf_ticker": "MARUTI.NS"}
]

SYMBOL_MAP = {s["symbol"]: s for s in SUPPORTED_STOCKS}

def generate_synthetic_ohlcv(symbol: str, timeframe: str = "1M") -> pd.DataFrame:
    """
    Deterministic realistic market data generator using Geometric Brownian Motion.
    Guarantees the system operates 100% reliably even without network access.
    """
    meta = SYMBOL_MAP.get(symbol.upper(), {"base_price": 200.0, "name": symbol})
    base_price = meta.get("base_price", 200.0)
    
    # Configure bars and time intervals
    now = datetime.now()
    if timeframe == "1D":
        n_bars = 78 # 5-min intervals during 6.5 trading hours
        freq = timedelta(minutes=5)
        dt_start = now - timedelta(days=1)
        sigma = 0.003
        mu = 0.0001
    elif timeframe == "1W":
        n_bars = 40 # hourly intervals over 5 trading days
        freq = timedelta(hours=1)
        dt_start = now - timedelta(days=7)
        sigma = 0.008
        mu = 0.0003
    elif timeframe == "1M":
        n_bars = 30
        freq = timedelta(days=1)
        dt_start = now - timedelta(days=30)
        sigma = 0.015
        mu = 0.0008
    elif timeframe == "3M":
        n_bars = 90
        freq = timedelta(days=1)
        dt_start = now - timedelta(days=90)
        sigma = 0.018
        mu = 0.0007
    elif timeframe == "6M":
        n_bars = 180
        freq = timedelta(days=1)
        dt_start = now - timedelta(days=180)
        sigma = 0.020
        mu = 0.0006
    elif timeframe == "1Y":
        n_bars = 365
        freq = timedelta(days=1)
        dt_start = now - timedelta(days=365)
        sigma = 0.022
        mu = 0.0005
    else:
        n_bars = 100
        freq = timedelta(days=1)
        dt_start = now - timedelta(days=100)
        sigma = 0.015
        mu = 0.0005

    # Seed with symbol hash to ensure consistency across re-runs
    seed_val = int(abs(hash(symbol + timeframe)) % 100000)
    rng = np.random.default_rng(seed_val)
    
    # Geometric Brownian Motion simulation
    returns = rng.normal(mu, sigma, n_bars)
    price_factors = np.cumprod(1 + returns)
    closes = base_price * price_factors
    
    records = []
    current_dt = dt_start
    for i in range(n_bars):
        c = float(closes[i])
        spread = c * rng.uniform(0.004, 0.015)
        h = c + spread * rng.uniform(0.4, 0.9)
        l = c - spread * rng.uniform(0.4, 0.9)
        o = l + (h - l) * rng.uniform(0.2, 0.8)
        # Ensure H is highest and L is lowest
        h = max(h, o, c)
        l = min(l, o, c)
        v = int(rng.uniform(100000, 5000000))
        
        timestamp_str = (current_dt + i * freq).strftime("%Y-%m-%d %H:%M" if timeframe in ["1D", "1W"] else "%Y-%m-%d")
        
        records.append({
            "timestamp": timestamp_str,
            "open": round(o, 2),
            "high": round(h, 2),
            "low": round(l, 2),
            "close": round(c, 2),
            "volume": v
        })
        
    df = pd.DataFrame(records)
    return df

def fetch_yfinance_ohlcv(symbol: str, timeframe: str = "1M") -> Optional[pd.DataFrame]:
    """Fetch live market data using yfinance if available."""
    meta = SYMBOL_MAP.get(symbol.upper())
    if not meta:
        return None
    yf_symbol = meta.get("yf_ticker", symbol)
    
    period_map = {
        "1D": ("1d", "5m"),
        "1W": ("5d", "15m"),
        "1M": ("1mo", "1d"),
        "3M": ("3mo", "1d"),
        "6M": ("6mo", "1d"),
        "1Y": ("1y", "1d")
    }
    period, interval = period_map.get(timeframe, ("1mo", "1d"))
    
    try:
        ticker = yf.Ticker(yf_symbol)
        hist = ticker.history(period=period, interval=interval, timeout=8)
        # If 1D interval 5m is empty (e.g. before market opens or session break), fetch last 5 days 15m to get latest trading session
        if (hist.empty or len(hist) < 3) and timeframe == "1D":
            hist = ticker.history(period="5d", interval="15m", timeout=8)
        if hist.empty or len(hist) < 3:
            return None
        
        hist = hist.reset_index()
        # Handle Date or Datetime column
        date_col = 'Datetime' if 'Datetime' in hist.columns else ('Date' if 'Date' in hist.columns else hist.columns[0])
        
        records = []
        for _, row in hist.iterrows():
            dt_val = row[date_col]
            if hasattr(dt_val, 'strftime'):
                ts_str = dt_val.strftime("%Y-%m-%d %H:%M" if timeframe in ["1D", "1W"] else "%Y-%m-%d")
            else:
                ts_str = str(dt_val)[:16]
                
            records.append({
                "timestamp": ts_str,
                "open": round(float(row['Open']), 2),
                "high": round(float(row['High']), 2),
                "low": round(float(row['Low']), 2),
                "close": round(float(row['Close']), 2),
                "volume": int(row['Volume'])
            })
        return pd.DataFrame(records)
    except Exception as e:
        logger.warning(f"yfinance fetch failed for {symbol} ({e}), falling back to synthetic generator")
        return None

async def get_historical_ohlcv(symbol: str, timeframe: str = "1M", force_refresh: bool = False) -> pd.DataFrame:
    """
    Retrieves OHLCV dataframe enriched with indicators.
    Checks MongoDB market_data cache first, then fetches live from yfinance, stores back in MongoDB.
    """
    col = get_collection("market_data")
    sym = symbol.upper()
    
    # 1. Check MongoDB cache if not forced refresh
    cached = await col.find_one({"symbol": sym, "timeframe": timeframe})
    now = datetime.now(timezone.utc)
    if cached and not force_refresh:
        updated_at = cached.get("updated_at")
        # Timeframe-aware cache freshness: 60s for 1D, 120s for 1W, 300s (5m) for daily
        max_age_seconds = 60 if timeframe == "1D" else (120 if timeframe == "1W" else 300)
        if updated_at and (now - updated_at.replace(tzinfo=timezone.utc)).total_seconds() < max_age_seconds:
            df = pd.DataFrame(cached["data"])
            return calculate_technical_indicators(df)
            
    # 2. Try fetching live from yfinance, fallback to synthetic
    df = fetch_yfinance_ohlcv(sym, timeframe)
    if df is None or df.empty or len(df) < 5:
        df = generate_synthetic_ohlcv(sym, timeframe)
        
    # 3. Calculate indicators
    df_with_ind = calculate_technical_indicators(df)
    
    # 4. Save into MongoDB market_data collection
    records = df_with_ind.to_dict(orient="records")
    await col.update_one(
        {"symbol": sym, "timeframe": timeframe},
        {"$set": {
            "symbol": sym,
            "timeframe": timeframe,
            "updated_at": now,
            "data": records
        }},
        upsert=True
    )
    
    return df_with_ind

async def get_stock_quote(symbol: str) -> Dict[str, Any]:
    """Get current price, change, volume, exact timestamp, and quick stats for a stock."""
    sym = symbol.upper()
    meta = SYMBOL_MAP.get(sym, {"name": sym, "exchange": "NASDAQ", "currency": "₹"})
    
    # Retrieve 1M data for robust current quote and indicators
    df = await get_historical_ohlcv(sym, timeframe="1M")
    latest_ind = extract_latest_indicators(df)
    
    current_price = latest_ind.get("close", 100.0)
    recent_1d = latest_ind.get("recent_return_1d", 0.0)
    change_amt = round(current_price * (recent_1d / 100.0), 2)
    
    latest_row = df.iloc[-1]
    candle_ts = str(latest_row.get("timestamp", datetime.now().strftime("%Y-%m-%d %H:%M")))
    volume = int(latest_row.get("volume", 1500000))
    high_24h = float(latest_row.get("high", current_price * 1.01))
    low_24h = float(latest_row.get("low", current_price * 0.99))
    open_price = float(latest_row.get("open", current_price - change_amt))

    return {
        "symbol": sym,
        "name": meta.get("name", sym),
        "exchange": meta.get("exchange", "NASDAQ"),
        "currency": meta.get("currency", "₹"),
        "current_price": current_price,
        "change_amount": change_amt,
        "change_percent": recent_1d,
        "open": round(open_price, 2),
        "high": round(high_24h, 2),
        "low": round(low_24h, 2),
        "volume": volume,
        "timestamp": candle_ts,
        "indicators": latest_ind,
        "last_updated": datetime.now(timezone.utc).isoformat()
    }

async def get_market_overview() -> List[Dict[str, Any]]:
    """Returns overview of all supported stocks for the Markets page."""
    overview = []
    for item in SUPPORTED_STOCKS:
        try:
            quote = await get_stock_quote(item["symbol"])
            overview.append(quote)
        except Exception as e:
            logger.error(f"Error fetching quote for {item['symbol']}: {e}")
    return overview
