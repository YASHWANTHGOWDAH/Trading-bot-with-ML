import math
import numpy as np
import pandas as pd
from typing import Dict, Any

def compute_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    """Calculate the Relative Strength Index (RSI)."""
    delta = series.diff()
    gain = (delta.where(delta > 0, 0.0)).copy()
    loss = (-delta.where(delta < 0, 0.0)).copy()

    # Exponential weighted moving average for smoothed Wilder RSI
    avg_gain = gain.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1/period, min_periods=period, adjust=False).mean()

    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    return rsi.fillna(50.0)

def compute_macd(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> Dict[str, pd.Series]:
    """Calculate MACD Line, Signal Line, and MACD Histogram."""
    ema_fast = series.ewm(span=fast, adjust=False).mean()
    ema_slow = series.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    macd_hist = macd_line - signal_line
    return {
        "macd": macd_line,
        "macd_signal": signal_line,
        "macd_hist": macd_hist
    }

def calculate_technical_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes technical indicators on OHLCV DataFrame:
    - SMA20 & SMA50
    - RSI (14)
    - MACD, MACD Signal, MACD Hist
    - Recent Returns (1-period and 5-period)
    - Volatility (20-period rolling std of returns)
    - SMA20-SMA50 Gap (%)
    """
    data = df.copy()
    
    # Ensure column names are lowercase
    data.columns = [c.lower() for c in data.columns]
    
    close = data['close'].ffill().bfill().fillna(100.0)
    data['close'] = close
    
    # Simple Moving Averages
    data['sma20'] = close.rolling(window=20, min_periods=1).mean().fillna(close)
    data['sma50'] = close.rolling(window=50, min_periods=1).mean().fillna(close)
    
    # RSI (14)
    data['rsi'] = compute_rsi(close, period=14)
    
    # MACD (12, 26, 9)
    macd_dict = compute_macd(close, fast=12, slow=26, signal=9)
    data['macd'] = macd_dict['macd'].fillna(0.0)
    data['macd_signal'] = macd_dict['macd_signal'].fillna(0.0)
    data['macd_hist'] = macd_dict['macd_hist'].fillna(0.0)
    
    # Returns
    data['recent_return_1d'] = close.pct_change(1).fillna(0.0) * 100.0
    data['recent_return_5d'] = close.pct_change(5).fillna(0.0) * 100.0
    
    # Volatility: 20-period rolling standard deviation of 1-day returns
    data['volatility'] = data['recent_return_1d'].rolling(window=20, min_periods=1).std().fillna(1.0)
    
    # SMA20 - SMA50 Gap in %
    data['sma_gap'] = ((data['sma20'] - data['sma50']) / data['sma50'].replace(0, np.nan) * 100.0).fillna(0.0)
    
    return data

def extract_latest_indicators(df: pd.DataFrame) -> Dict[str, Any]:
    """Extract latest calculated indicator values for UI cards and explainability."""
    if df.empty:
        return {}
        
    def _clean(val, default=0.0):
        try:
            f = float(val)
            if math.isnan(f) or math.isinf(f):
                return default
            return f
        except Exception:
            return default

    # Forward fill to ensure no trailing NaNs
    clean_df = df.ffill().bfill().fillna(0.0)
    latest = clean_df.iloc[-1]
    
    close = _clean(latest.get('close', 100.0), 100.0)
    sma20 = _clean(latest.get('sma20', close), close)
    sma50 = _clean(latest.get('sma50', close), close)
    rsi = _clean(latest.get('rsi', 50.0), 50.0)
    macd = _clean(latest.get('macd', 0.0), 0.0)
    macd_signal = _clean(latest.get('macd_signal', 0.0), 0.0)
    macd_hist = _clean(latest.get('macd_hist', 0.0), 0.0)
    return_1d = _clean(latest.get('recent_return_1d', 0.0), 0.0)
    return_5d = _clean(latest.get('recent_return_5d', 0.0), 0.0)
    volatility = _clean(latest.get('volatility', 1.0), 1.0)
    sma_gap = _clean(latest.get('sma_gap', 0.0), 0.0)
    
    return {
        "close": round(close, 2),
        "sma20": round(sma20, 2),
        "sma50": round(sma50, 2),
        "rsi": round(rsi, 2),
        "macd": round(macd, 4),
        "macd_signal": round(macd_signal, 4),
        "macd_hist": round(macd_hist, 4),
        "recent_return_1d": round(return_1d, 2),
        "recent_return_5d": round(return_5d, 2),
        "volatility": round(volatility, 2),
        "sma_gap": round(sma_gap, 2),
        "price_vs_sma20": "ABOVE" if close >= sma20 else "BELOW",
        "sma20_vs_sma50": "ABOVE" if sma20 >= sma50 else "BELOW",
        "macd_trend": "BULLISH" if macd_hist > 0 else "BEARISH",
        "rsi_state": "OVERBOUGHT" if rsi >= 70 else ("OVERSOLD" if rsi <= 30 else "NEUTRAL")
    }
