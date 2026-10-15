import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from bson import ObjectId
from app.database import get_collection
from app.services.market_data import get_historical_ohlcv
from app.services.indicators import calculate_technical_indicators
from app.services.ml import train_and_predict
from app.services.signal_engine import generate_signal_and_explanations

logger = logging.getLogger("trademind.backtesting")

def run_backtest_simulation(
    df: pd.DataFrame,
    symbol: str,
    strategy: str,
    initial_capital: float = 100000.0
) -> Dict[str, Any]:
    """
    Simulates trading strategy across chronological candles.
    Tracks equity curve, positions, trade logs, win rate, and drawdown.
    """
    data = calculate_technical_indicators(df).copy()
    if len(data) < 20:
        raise ValueError("Historical data must contain at least 20 periods for backtesting.")

    cash = float(initial_capital)
    shares = 0
    trade_history: List[Dict[str, Any]] = []
    equity_curve: List[Dict[str, Any]] = []
    signals_log: List[Dict[str, Any]] = []
    
    peak_equity = cash
    max_drawdown = 0.0
    
    # Pre-generate ML signals if ML strategy is selected
    ml_signals = ["HOLD"] * len(data)
    if "ML" in strategy.upper():
        last_sig = "HOLD"
        for idx in range(15, len(data)):
            # Re-train every 3 bars or on significant moves for fast, responsive performance
            if (idx - 15) % 3 == 0 or idx == len(data) - 1:
                window_df = data.iloc[:idx+1]
                ml_out = train_and_predict(window_df, model_type="RandomForest")
                up_prob = ml_out.get("up_probability", 0.5)
                down_prob = ml_out.get("down_probability", 0.5)
                if up_prob >= 0.58:
                    last_sig = "BUY"
                elif down_prob >= 0.58:
                    last_sig = "SELL"
                else:
                    last_sig = "HOLD"
            ml_signals[idx] = last_sig
    
    for i in range(len(data)):
        row = data.iloc[i]
        price = float(row["close"])
        ts = str(row.get("timestamp", f"Day-{i+1}"))
        sma20 = float(row.get("sma20", price))
        sma50 = float(row.get("sma50", price))
        rsi = float(row.get("rsi", 50.0))
        
        signal = "HOLD"
        
        if "ML" in strategy.upper():
            signal = ml_signals[i] if i < len(ml_signals) else "HOLD"
        elif "SMA" in strategy.upper():
            # SMA Golden/Death Cross
            if i > 0:
                prev_sma20 = float(data.iloc[i-1].get("sma20", price))
                prev_sma50 = float(data.iloc[i-1].get("sma50", price))
                if prev_sma20 <= prev_sma50 and sma20 > sma50:
                    signal = "BUY"
                elif prev_sma20 >= prev_sma50 and sma20 < sma50:
                    signal = "SELL"
        elif "RSI" in strategy.upper():
            # RSI Momentum (oversold recovery buy, overbought exit sell)
            if rsi < 35:
                signal = "BUY"
            elif rsi > 68:
                signal = "SELL"

        # Trade Execution Logic
        if signal == "BUY" and cash > price:
            # Allocate available cash into shares
            buy_qty = int(cash // price)
            if buy_qty > 0:
                cost = buy_qty * price
                cash -= cost
                shares += buy_qty
                trade_history.append({
                    "timestamp": ts,
                    "action": "BUY",
                    "price": round(price, 2),
                    "quantity": buy_qty,
                    "amount": round(cost, 2),
                    "cash_remaining": round(cash, 2),
                    "realized_pl": 0.0
                })
                signals_log.append({"timestamp": ts, "price": round(price, 2), "signal": "BUY"})
                
        elif signal == "SELL" and shares > 0:
            proceeds = shares * price
            # Find matching recent buys to estimate P/L
            avg_entry = price
            for t in reversed(trade_history):
                if t["action"] == "BUY":
                    avg_entry = t["price"]
                    break
            realized_pl = (price - avg_entry) * shares
            cash += proceeds
            trade_history.append({
                "timestamp": ts,
                "action": "SELL",
                "price": round(price, 2),
                "quantity": shares,
                "amount": round(proceeds, 2),
                "cash_remaining": round(cash, 2),
                "realized_pl": round(realized_pl, 2)
            })
            signals_log.append({"timestamp": ts, "price": round(price, 2), "signal": "SELL"})
            shares = 0
            
        current_equity = cash + (shares * price)
        if current_equity > peak_equity:
            peak_equity = current_equity
            
        drawdown = ((peak_equity - current_equity) / peak_equity * 100.0) if peak_equity > 0 else 0.0
        if drawdown > max_drawdown:
            max_drawdown = drawdown
            
        equity_curve.append({
            "timestamp": ts,
            "portfolio_value": round(current_equity, 2),
            "stock_price": round(price, 2)
        })

    # Liquidate remaining shares at last price for final capital computation
    final_equity = cash + (shares * float(data.iloc[-1]["close"]))
    total_return = ((final_equity - initial_capital) / initial_capital) * 100.0
    net_profit = final_equity - initial_capital
    
    # Calculate win rate and trade statistics
    sell_trades = [t for t in trade_history if t["action"] == "SELL"]
    winning_trades = [t for t in sell_trades if t["realized_pl"] > 0]
    losing_trades = [t for t in sell_trades if t["realized_pl"] <= 0]
    
    total_trades_count = len(sell_trades)
    win_rate = (len(winning_trades) / total_trades_count * 100.0) if total_trades_count > 0 else 0.0
    
    gross_profits = sum(t["realized_pl"] for t in winning_trades)
    gross_losses = abs(sum(t["realized_pl"] for t in losing_trades))
    profit_factor = round(gross_profits / gross_losses, 2) if gross_losses > 0 else (99.0 if gross_profits > 0 else 1.0)

    return {
        "symbol": symbol.upper(),
        "strategy": strategy,
        "initial_capital": round(initial_capital, 2),
        "final_capital": round(final_equity, 2),
        "net_profit": round(net_profit, 2),
        "total_return_percent": round(total_return, 2),
        "total_trades": total_trades_count,
        "winning_trades": len(winning_trades),
        "losing_trades": len(losing_trades),
        "win_rate_percent": round(win_rate, 2),
        "profit_factor": profit_factor,
        "max_drawdown_percent": round(max_drawdown, 2),
        "equity_curve": equity_curve,
        "trade_history": trade_history[-50:], # return latest 50 for clean display
        "signals": signals_log
    }

async def execute_and_save_backtest(
    user_email: str,
    symbol: str,
    strategy: str,
    timeframe: str = "6M",
    initial_capital: float = 100000.0
) -> Dict[str, Any]:
    """Retrieves data, runs backtest simulation, and saves summary in MongoDB backtests collection."""
    df = await get_historical_ohlcv(symbol.upper(), timeframe=timeframe)
    result = run_backtest_simulation(df, symbol.upper(), strategy, initial_capital)
    
    backtests_col = get_collection("backtests")
    doc = {
        "user_email": user_email,
        "symbol": symbol.upper(),
        "strategy": strategy,
        "timeframe": timeframe,
        "initial_capital": result["initial_capital"],
        "final_capital": result["final_capital"],
        "net_profit": result["net_profit"],
        "total_return_percent": result["total_return_percent"],
        "total_trades": result["total_trades"],
        "win_rate_percent": result["win_rate_percent"],
        "max_drawdown_percent": result["max_drawdown_percent"],
        "equity_curve": result["equity_curve"],
        "trade_history": result["trade_history"],
        "created_at": datetime.now(timezone.utc)
    }
    insert_res = await backtests_col.insert_one(doc)
    result["id"] = str(insert_res.inserted_id)
    return result
