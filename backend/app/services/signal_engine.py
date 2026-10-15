import logging
from datetime import datetime, timezone
from typing import Dict, Any, List
import pandas as pd
from app.database import get_collection
from app.services.indicators import extract_latest_indicators, calculate_technical_indicators
from app.services.ml import train_and_predict

logger = logging.getLogger("trademind.signal_engine")

BUY_THRESHOLD = 0.58
SELL_THRESHOLD = 0.58

def generate_signal_and_explanations(
    symbol: str,
    indicators: Dict[str, Any],
    ml_result: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Combines ML prediction probabilities with technical indicator thresholds
    to generate an explainable BUY / SELL / HOLD signal.
    """
    up_prob = ml_result.get("up_probability", 0.50)
    down_prob = ml_result.get("down_probability", 0.50)
    
    close = indicators.get("close", 0.0)
    sma20 = indicators.get("sma20", close)
    sma50 = indicators.get("sma50", close)
    rsi = indicators.get("rsi", 50.0)
    macd = indicators.get("macd", 0.0)
    macd_hist = indicators.get("macd_hist", 0.0)
    return_1d = indicators.get("recent_return_1d", 0.0)
    volatility = indicators.get("volatility", 1.0)
    sma_gap = indicators.get("sma_gap", 0.0)

    # Bullish condition count
    bullish_factors = 0
    bearish_factors = 0
    
    if close >= sma20:
        bullish_factors += 1
    else:
        bearish_factors += 1
        
    if sma20 >= sma50:
        bullish_factors += 1
    else:
        bearish_factors += 1
        
    if macd_hist > 0:
        bullish_factors += 1
    else:
        bearish_factors += 1
        
    if 40 <= rsi <= 72:
        bullish_factors += 1
    elif rsi < 40 or rsi > 72:
        bearish_factors += 1
        
    if return_1d > 0:
        bullish_factors += 1
    else:
        bearish_factors += 1

    # Signal Decision Logic
    reasons: List[str] = []
    
    if up_prob >= BUY_THRESHOLD and bullish_factors >= 2:
        signal = "BUY"
        confidence = round(up_prob * 100, 1)
        
        # Explainable AI reasons for BUY
        if close >= sma20:
            reasons.append(f"Price ({close}) is trading above SMA20 ({sma20})")
        if sma20 >= sma50:
            reasons.append(f"SMA20 is above SMA50 ({sma_gap}% gap showing bullish trend)")
        if macd_hist > 0:
            reasons.append(f"MACD histogram is positive (+{macd_hist}) confirming upward acceleration")
        if 40 <= rsi <= 70:
            reasons.append(f"RSI ({rsi}) indicates steady positive momentum without overbought risk")
        if return_1d > 0:
            reasons.append(f"Recent 24h return is positive (+{return_1d}%)")
        reasons.append(f"Random Forest ML model assigns {round(up_prob * 100, 1)}% probability to upward price movement")

    elif down_prob >= SELL_THRESHOLD and bearish_factors >= 2:
        signal = "SELL"
        confidence = round(down_prob * 100, 1)
        
        # Explainable AI reasons for SELL
        if close < sma20:
            reasons.append(f"Price ({close}) has broken below SMA20 ({sma20})")
        if sma20 < sma50:
            reasons.append(f"SMA20 is below SMA50 ({sma_gap}% gap reflecting bearish structure)")
        if macd_hist < 0:
            reasons.append(f"MACD histogram is negative ({macd_hist}) indicating downward momentum")
        if rsi < 45 or rsi > 70:
            reasons.append(f"RSI ({rsi}) signals selling pressure or exhaustion")
        if return_1d < 0:
            reasons.append(f"Recent 24h return is negative ({return_1d}%)")
        reasons.append(f"Random Forest ML model assigns {round(down_prob * 100, 1)}% probability to downward price movement")
        
    else:
        signal = "HOLD"
        confidence = round(max(up_prob, down_prob) * 100, 1)
        
        # Explainable AI reasons for HOLD
        reasons.append("Technical indicators show mixed or conflicting trend signals")
        reasons.append(f"ML directional probability ({round(max(up_prob, down_prob)*100, 1)}%) has not crossed the 58% conviction threshold")
        if abs(return_1d) < 0.5:
            reasons.append("Price action is currently consolidating within a tight range")
        else:
            reasons.append("Market momentum is indecisive between buyers and sellers")
        reasons.append(f"RSI ({rsi}) is neutral and moving averages are converging")

    return {
        "symbol": symbol.upper(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "signal": signal,
        "confidence": confidence,
        "up_probability": round(up_prob * 100, 1),
        "down_probability": round(down_prob * 100, 1),
        "model_name": ml_result.get("model_name", "RandomForest"),
        "train_accuracy": ml_result.get("train_accuracy", 0.0),
        "test_accuracy": ml_result.get("test_accuracy", 0.0),
        "reasons": reasons,
        "indicators": indicators,
        "feature_importances": ml_result.get("feature_importances", {})
    }

async def generate_and_save_analysis(symbol: str, df: pd.DataFrame) -> Dict[str, Any]:
    """
    Executes ML inference, calculates technical indicators, synthesizes BUY/SELL/HOLD signal,
    and persists prediction & signal documents into MongoDB collections.
    """
    sym = symbol.upper()
    df_with_ind = calculate_technical_indicators(df)
    latest_ind = extract_latest_indicators(df_with_ind)
    
    # Run ML prediction pipeline
    ml_output = train_and_predict(df_with_ind, model_type="RandomForest")
    
    # Synthesize signal & explanations
    analysis = generate_signal_and_explanations(sym, latest_ind, ml_output)
    
    # Persist in MongoDB
    pred_col = get_collection("predictions")
    signals_col = get_collection("signals")
    
    db_doc = {
        "symbol": sym,
        "timestamp": datetime.now(timezone.utc),
        "signal": analysis["signal"],
        "confidence": analysis["confidence"],
        "up_probability": analysis["up_probability"],
        "down_probability": analysis["down_probability"],
        "model_name": analysis["model_name"],
        "train_accuracy": analysis["train_accuracy"],
        "test_accuracy": analysis["test_accuracy"],
        "reasons": analysis["reasons"],
        "indicators": analysis["indicators"],
        "feature_importances": analysis["feature_importances"]
    }
    
    await pred_col.insert_one(db_doc.copy())
    
    # Update latest signal collection
    await signals_col.update_one(
        {"symbol": sym},
        {"$set": db_doc},
        upsert=True
    )
    
    return analysis
