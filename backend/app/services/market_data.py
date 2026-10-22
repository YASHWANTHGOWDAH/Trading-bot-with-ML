import asyncio
import logging
import math
import random
import time
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
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
    {"symbol": "AAPL", "name": "Apple Inc.", "exchange": "NASDAQ", "currency": "$", "base_price": 224.50, "yf_ticker": "AAPL"},
    {"symbol": "MSFT", "name": "Microsoft Corp.", "exchange": "NASDAQ", "currency": "$", "base_price": 428.10, "yf_ticker": "MSFT"},
    {"symbol": "NVDA", "name": "NVIDIA Corporation", "exchange": "NASDAQ", "currency": "$", "base_price": 122.80, "yf_ticker": "NVDA"},
    {"symbol": "TSLA", "name": "Tesla Inc.", "exchange": "NASDAQ", "currency": "$", "base_price": 248.20, "yf_ticker": "TSLA"},
    {"symbol": "AMZN", "name": "Amazon.com Inc.", "exchange": "NASDAQ", "currency": "$", "base_price": 186.40, "yf_ticker": "AMZN"},
    {"symbol": "GOOGL", "name": "Alphabet Inc.", "exchange": "NASDAQ", "currency": "$", "base_price": 164.75, "yf_ticker": "GOOGL"},
    {"symbol": "META", "name": "Meta Platforms Inc.", "exchange": "NASDAQ", "currency": "$", "base_price": 585.30, "yf_ticker": "META"},
    {"symbol": "NFLX", "name": "Netflix Inc.", "exchange": "NASDAQ", "currency": "$", "base_price": 710.20, "yf_ticker": "NFLX"},
    {"symbol": "AMD", "name": "Advanced Micro Devices", "exchange": "NASDAQ", "currency": "$", "base_price": 165.40, "yf_ticker": "AMD"},
    {"symbol": "INTC", "name": "Intel Corporation", "exchange": "NASDAQ", "currency": "$", "base_price": 22.80, "yf_ticker": "INTC"},

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

def check_market_status(exchange_or_symbol: str = "NSE") -> Dict[str, Any]:
    """Calculates active session status for NSE and US (NASDAQ/NYSE) markets."""
    target = exchange_or_symbol.upper()
    is_us = target in ["NASDAQ", "NYSE", "US"] or target in [
        "AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "GOOGL", "META", "NFLX", "AMD", "INTC"
    ]
    tz_str = "America/New_York" if is_us else "Asia/Kolkata"
    tz = ZoneInfo(tz_str)
    local_now = datetime.now(tz)
    weekday = local_now.weekday()  # 0=Monday, 6=Sunday
    is_weekend = weekday >= 5
    total_minutes = local_now.hour * 60 + local_now.minute

    # Regular trading hours (minutes from midnight):
    # NSE: 9:15 AM - 3:30 PM (555 to 930)
    # US: 9:30 AM - 4:00 PM (570 to 960)
    open_min = 570 if is_us else 555
    close_min = 960 if is_us else 930
    is_open = (not is_weekend) and (open_min <= total_minutes < close_min)
    exchange_name = "NASDAQ" if is_us else "NSE"
    session_open_str = "9:30 AM ET" if is_us else "9:15 AM IST"

    if is_open:
        mins_left = close_min - total_minutes
        h, m = mins_left // 60, mins_left % 60
        h_str = f"{h}h " if h > 0 else ""
        detail = f"Closes in {h_str}{m}m ({exchange_name})"
    elif is_weekend:
        detail = f"Weekend • Opens Mon {session_open_str}"
    elif total_minutes < open_min:
        mins_left = open_min - total_minutes
        h, m = mins_left // 60, mins_left % 60
        h_str = f"{h}h " if h > 0 else ""
        detail = f"Opens in {h_str}{m}m ({session_open_str})"
    else:
        next_day = "Mon" if weekday == 4 else "Tomorrow"
        detail = f"Closed for day • Opens {next_day} {session_open_str}"

    return {
        "is_open": is_open,
        "isOpen": is_open,
        "status": "OPEN" if is_open else "CLOSED",
        "badge": "OPEN" if is_open else "CLOSED",
        "exchange": exchange_name,
        "exchangeName": exchange_name,
        "detail": detail,
        "local_time": local_now.strftime("%H:%M %Z"),
        "localTime": local_now.strftime("%H:%M %Z")
    }

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
        # Drop rows where Close is missing
        hist = hist.dropna(subset=['Close'])
        if hist.empty or len(hist) < 3:
            return None
            
        hist['Open'] = hist['Open'].fillna(hist['Close'])
        hist['High'] = hist['High'].fillna(hist['Close'])
        hist['Low'] = hist['Low'].fillna(hist['Close'])
        hist['Volume'] = hist['Volume'].fillna(1000000)
        
        # Handle Date or Datetime column
        date_col = 'Datetime' if 'Datetime' in hist.columns else ('Date' if 'Date' in hist.columns else hist.columns[0])
        
        records = []
        for _, row in hist.iterrows():
            dt_val = row[date_col]
            if hasattr(dt_val, 'strftime'):
                ts_str = dt_val.strftime("%Y-%m-%d %H:%M" if timeframe in ["1D", "1W"] else "%Y-%m-%d")
            else:
                ts_str = str(dt_val)[:16]
            
            c_val = float(row['Close']) if (not pd.isna(row['Close']) and not math.isnan(float(row['Close']))) else 100.0
            o_val = float(row['Open']) if (not pd.isna(row['Open']) and not math.isnan(float(row['Open']))) else c_val
            h_val = float(row['High']) if (not pd.isna(row['High']) and not math.isnan(float(row['High']))) else max(c_val, o_val)
            l_val = float(row['Low']) if (not pd.isna(row['Low']) and not math.isnan(float(row['Low']))) else min(c_val, o_val)
            v_val = int(row['Volume']) if (not pd.isna(row['Volume']) and not math.isnan(float(row['Volume']))) else 1000000
                
            records.append({
                "timestamp": ts_str,
                "open": round(o_val, 2),
                "high": round(h_val, 2),
                "low": round(l_val, 2),
                "close": round(c_val, 2),
                "volume": v_val
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
            df = df.ffill().bfill().fillna(0.0)
            return calculate_technical_indicators(df).ffill().bfill().fillna(0.0)
            
    # 2. Try fetching live from yfinance (run in thread pool to prevent blocking async loop)
    df = await asyncio.to_thread(fetch_yfinance_ohlcv, sym, timeframe)
    if df is None or df.empty or len(df) < 5:
        df = generate_synthetic_ohlcv(sym, timeframe)
        
    # 3. Calculate indicators and ensure no residual NaNs
    df_with_ind = calculate_technical_indicators(df)
    df_with_ind = df_with_ind.ffill().bfill().fillna(0.0)
    
    # 4. Save clean records into MongoDB market_data collection
    records = _clean_json_floats(df_with_ind.to_dict(orient="records"))
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
    
    return pd.DataFrame(records)

# Ultra-fast in-memory quote caching for sub-second responses
_FAST_QUOTE_CACHE: Dict[str, Dict[str, Any]] = {}
_INDICATOR_SNAPSHOT_CACHE: Dict[str, Dict[str, Any]] = {}
FAST_QUOTE_CACHE_TTL = 3.5  # 3.5 seconds cache TTL

def _clean_json_floats(obj: Any) -> Any:
    """Recursively converts nan or inf floats to 0.0 to guarantee standard JSON compliance."""
    if isinstance(obj, float):
        return 0.0 if (math.isnan(obj) or math.isinf(obj)) else obj
    if isinstance(obj, dict):
        return {k: _clean_json_floats(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_clean_json_floats(v) for v in obj]
    return obj

def _fetch_fast_info_sync(yf_symbol: str) -> Optional[Dict[str, Any]]:
    """Synchronous worker that queries yfinance fast_info in a background worker thread."""
    try:
        ticker = yf.Ticker(yf_symbol)
        fast = ticker.fast_info
        last_price = getattr(fast, "last_price", None)
        if last_price is not None and not np.isnan(last_price) and float(last_price) > 0:
            last_p = round(float(last_price), 2)
            prev_close = getattr(fast, "previous_close", None)
            prev_p = round(float(prev_close), 2) if (prev_close is not None and not np.isnan(prev_close)) else last_p
            open_p = getattr(fast, "open", None)
            open_price = round(float(open_p), 2) if (open_p is not None and not np.isnan(open_p)) else prev_p
            high_p = getattr(fast, "day_high", None)
            day_high = round(float(high_p), 2) if (high_p is not None and not np.isnan(high_p)) else max(last_p, open_price)
            low_p = getattr(fast, "day_low", None)
            day_low = round(float(low_p), 2) if (low_p is not None and not np.isnan(low_p)) else min(last_p, open_price)
            vol = getattr(fast, "last_volume", None)
            volume = int(vol) if (vol is not None and not np.isnan(vol)) else 1500000
            
            return {
                "last_price": last_p,
                "previous_close": prev_p,
                "open": open_price,
                "high": day_high,
                "low": day_low,
                "volume": volume
            }
    except Exception as e:
        logger.debug(f"fast_info sync fetch failed for {yf_symbol}: {e}")
    return None

async def get_stock_quote(symbol: str, force_refresh: bool = False) -> Dict[str, Any]:
    """
    Get current price, change, volume, exact timestamp, and stats for a stock in a fraction of a second.
    Uses yfinance fast_info in a thread pool and a 3.5-second in-memory cache.
    Falls back gracefully to OHLCV cache and synthetic model so it never fails.
    """
    sym = symbol.upper()
    meta = SYMBOL_MAP.get(sym, {"name": sym, "exchange": "NASDAQ", "currency": "$", "base_price": 100.0})
    yf_symbol = meta.get("yf_ticker", sym)
    currency = meta.get("currency", "$" if meta.get("exchange") == "NASDAQ" else "₹")
    
    now_ts = time.time()
    
    # 1. Fast cache hit (< 0.001s)
    if not force_refresh and sym in _FAST_QUOTE_CACHE:
        cached_entry = _FAST_QUOTE_CACHE[sym]
        if (now_ts - cached_entry["cached_at"]) < FAST_QUOTE_CACHE_TTL:
            return cached_entry["data"]

    # 2. Fast-path: query yfinance fast_info asynchronously in a thread pool
    fast_data = await asyncio.to_thread(_fetch_fast_info_sync, yf_symbol)
    
    if fast_data:
        current_price = fast_data["last_price"]
        prev_close = fast_data["previous_close"]
        change_amt = round(current_price - prev_close, 2)
        change_pct = round((change_amt / prev_close) * 100, 2) if prev_close > 0 else 0.0
        
        # Snapshot or reuse technical indicators
        indicators = _INDICATOR_SNAPSHOT_CACHE.get(sym)
        if not indicators:
            try:
                df = await get_historical_ohlcv(sym, timeframe="1M")
                indicators = extract_latest_indicators(df)
                _INDICATOR_SNAPSHOT_CACHE[sym] = indicators
            except Exception:
                indicators = {
                    "close": current_price,
                    "rsi": 50.0,
                    "macd_trend": "BULLISH" if change_pct >= 0 else "BEARISH",
                    "rsi_state": "NEUTRAL"
                }
        else:
            indicators = dict(indicators)
            indicators["close"] = current_price
            indicators["recent_return_1d"] = change_pct

        quote_data = {
            "symbol": sym,
            "name": meta.get("name", sym),
            "exchange": meta.get("exchange", "NASDAQ"),
            "currency": currency,
            "current_price": current_price,
            "change_amount": change_amt,
            "change_percent": change_pct,
            "open": fast_data["open"],
            "high": fast_data["high"],
            "low": fast_data["low"],
            "volume": fast_data["volume"],
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
            "indicators": indicators,
            "market_status": check_market_status(meta.get("exchange", "NASDAQ")),
            "source": "yfinance_live",
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
        cleaned_quote = _clean_json_floats(quote_data)
        _FAST_QUOTE_CACHE[sym] = {"cached_at": now_ts, "data": cleaned_quote}
        return cleaned_quote

    # 3. Fallback: historical OHLCV pipeline
    df = await get_historical_ohlcv(sym, timeframe="1M")
    latest_ind = extract_latest_indicators(df)
    _INDICATOR_SNAPSHOT_CACHE[sym] = latest_ind
    
    current_price = latest_ind.get("close", meta.get("base_price", 100.0))
    recent_1d = latest_ind.get("recent_return_1d", 0.0)
    change_amt = round(current_price * (recent_1d / 100.0), 2)
    
    latest_row = df.iloc[-1]
    candle_ts = str(latest_row.get("timestamp", datetime.now().strftime("%Y-%m-%d %H:%M")))
    volume = int(latest_row.get("volume", 1500000))
    high_24h = float(latest_row.get("high", current_price * 1.01))
    low_24h = float(latest_row.get("low", current_price * 0.99))
    open_price = float(latest_row.get("open", current_price - change_amt))

    quote_data = {
        "symbol": sym,
        "name": meta.get("name", sym),
        "exchange": meta.get("exchange", "NASDAQ"),
        "currency": currency,
        "current_price": current_price,
        "change_amount": change_amt,
        "change_percent": recent_1d,
        "open": round(open_price, 2),
        "high": round(high_24h, 2),
        "low": round(low_24h, 2),
        "volume": volume,
        "timestamp": candle_ts,
        "indicators": latest_ind,
        "market_status": check_market_status(meta.get("exchange", "NASDAQ")),
        "source": "ohlcv_cache",
        "last_updated": datetime.now(timezone.utc).isoformat()
    }
    cleaned_fallback = _clean_json_floats(quote_data)
    _FAST_QUOTE_CACHE[sym] = {"cached_at": now_ts, "data": cleaned_fallback}
    return cleaned_fallback

async def get_market_overview() -> List[Dict[str, Any]]:
    """Returns overview of all supported stocks for the Markets page concurrently in parallel."""
    tasks = [get_stock_quote(item["symbol"]) for item in SUPPORTED_STOCKS]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    overview = []
    for item, res in zip(SUPPORTED_STOCKS, results):
        if isinstance(res, dict):
            overview.append(res)
        else:
            logger.error(f"Error fetching quote for {item['symbol']}: {res}")
            base_p = item.get("base_price", 100.0)
            curr = item.get("currency", "$" if item.get("exchange") == "NASDAQ" else "₹")
            overview.append({
                "symbol": item["symbol"],
                "name": item["name"],
                "exchange": item["exchange"],
                "currency": curr,
                "current_price": base_p,
                "change_amount": 0.0,
                "change_percent": 0.0,
                "open": base_p,
                "high": base_p,
                "low": base_p,
                "volume": 1000000,
                "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
                "indicators": {},
                "source": "fallback",
                "last_updated": datetime.now(timezone.utc).isoformat()
            })
    return overview
