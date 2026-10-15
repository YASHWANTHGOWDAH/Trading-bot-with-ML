import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status
from app.database import get_collection
from app.config import settings
from app.services.market_data import get_stock_quote

logger = logging.getLogger("trademind.portfolio")

async def get_or_create_portfolio(user_email: str) -> Dict[str, Any]:
    """Retrieve user portfolio or initialize with default ₹1,00,000 virtual cash."""
    portfolios_col = get_collection("portfolios")
    portfolio = await portfolios_col.find_one({"user_email": user_email})
    
    if not portfolio:
        portfolio = {
            "user_email": user_email,
            "cash": settings.INITIAL_VIRTUAL_CAPITAL,
            "initial_capital": settings.INITIAL_VIRTUAL_CAPITAL,
            "total_value": settings.INITIAL_VIRTUAL_CAPITAL,
            "invested_capital": 0.0,
            "total_pl": 0.0,
            "total_pl_percent": 0.0,
            "today_pl": 0.0,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        await portfolios_col.insert_one(portfolio)
        
    return portfolio

async def calculate_live_portfolio(user_email: str) -> Dict[str, Any]:
    """
    Computes real-time portfolio metrics dynamically based on current market prices
    for all holdings owned by the user.
    """
    portfolio = await get_or_create_portfolio(user_email)
    cash = float(portfolio.get("cash", settings.INITIAL_VIRTUAL_CAPITAL))
    initial_cap = float(portfolio.get("initial_capital", settings.INITIAL_VIRTUAL_CAPITAL))
    
    holdings_col = get_collection("holdings")
    user_holdings = await holdings_col.find({"user_email": user_email}).to_list(100)
    
    total_invested = 0.0
    current_holdings_value = 0.0
    today_pl = 0.0
    enriched_holdings = []
    
    for h in user_holdings:
        sym = h["symbol"]
        qty = int(h["quantity"])
        avg_price = float(h["avg_buy_price"])
        invested = qty * avg_price
        total_invested += invested
        
        # Get live quote
        try:
            quote = await get_stock_quote(sym)
            current_price = quote["current_price"]
            change_pct = quote.get("change_percent", 0.0)
        except Exception:
            current_price = avg_price
            change_pct = 0.0
            
        cur_val = qty * current_price
        current_holdings_value += cur_val
        unrealized_pl = cur_val - invested
        unrealized_pl_pct = (unrealized_pl / invested * 100.0) if invested > 0 else 0.0
        
        # Today's PL approximation based on 24h change
        daily_diff = cur_val * (change_pct / 100.0)
        today_pl += daily_diff
        
        enriched_holdings.append({
            "symbol": sym,
            "quantity": qty,
            "avg_buy_price": round(avg_price, 2),
            "current_price": round(current_price, 2),
            "current_value": round(cur_val, 2),
            "invested_amount": round(invested, 2),
            "unrealized_pl": round(unrealized_pl, 2),
            "unrealized_pl_percent": round(unrealized_pl_pct, 2),
            "change_percent_24h": round(change_pct, 2)
        })
        
    total_portfolio_value = cash + current_holdings_value
    total_pl = total_portfolio_value - initial_cap
    total_pl_percent = (total_pl / initial_cap * 100.0) if initial_cap > 0 else 0.0
    
    # Update portfolio document in MongoDB
    portfolios_col = get_collection("portfolios")
    updated_doc = {
        "cash": round(cash, 2),
        "total_value": round(total_portfolio_value, 2),
        "invested_capital": round(total_invested, 2),
        "total_pl": round(total_pl, 2),
        "total_pl_percent": round(total_pl_percent, 2),
        "today_pl": round(today_pl, 2),
        "updated_at": datetime.now(timezone.utc)
    }
    await portfolios_col.update_one({"user_email": user_email}, {"$set": updated_doc})
    
    return {
        "user_email": user_email,
        "cash": round(cash, 2),
        "initial_capital": round(initial_cap, 2),
        "total_value": round(total_portfolio_value, 2),
        "invested_capital": round(total_invested, 2),
        "total_pl": round(total_pl, 2),
        "total_pl_percent": round(total_pl_percent, 2),
        "today_pl": round(today_pl, 2),
        "holdings": enriched_holdings,
        "holdings_count": len(enriched_holdings)
    }

async def execute_trade(
    user_email: str,
    symbol: str,
    action: str, # "BUY" or "SELL"
    quantity: int,
    signal_info: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Executes a virtual paper trade:
    - Validates cash/holdings
    - Adjusts balance and weighted average price
    - Logs trade document in MongoDB trades collection
    """
    if quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trade quantity must be a positive integer greater than zero."
        )
        
    sym = symbol.upper()
    quote = await get_stock_quote(sym)
    current_price = quote["current_price"]
    total_order_value = current_price * quantity
    
    portfolio = await get_or_create_portfolio(user_email)
    cash = float(portfolio.get("cash", settings.INITIAL_VIRTUAL_CAPITAL))
    
    holdings_col = get_collection("holdings")
    trades_col = get_collection("trades")
    portfolios_col = get_collection("portfolios")
    
    action = action.upper()
    realized_pl = 0.0
    
    if action == "BUY":
        if cash < total_order_value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient virtual cash. Needed: ₹{round(total_order_value, 2)}, Available: ₹{round(cash, 2)}"
            )
            
        # Deduct cash
        new_cash = cash - total_order_value
        await portfolios_col.update_one({"user_email": user_email}, {"$set": {"cash": new_cash}})
        
        # Update or create holding
        existing_holding = await holdings_col.find_one({"user_email": user_email, "symbol": sym})
        if existing_holding:
            old_qty = int(existing_holding["quantity"])
            old_avg = float(existing_holding["avg_buy_price"])
            new_qty = old_qty + quantity
            new_avg = ((old_qty * old_avg) + total_order_value) / new_qty
            
            await holdings_col.update_one(
                {"_id": existing_holding["_id"]},
                {"$set": {
                    "quantity": new_qty,
                    "avg_buy_price": round(new_avg, 2),
                    "total_invested": round(new_qty * new_avg, 2),
                    "updated_at": datetime.now(timezone.utc)
                }}
            )
        else:
            await holdings_col.insert_one({
                "user_email": user_email,
                "symbol": sym,
                "quantity": quantity,
                "avg_buy_price": round(current_price, 2),
                "total_invested": round(total_order_value, 2),
                "updated_at": datetime.now(timezone.utc)
            })
            
    elif action == "SELL":
        existing_holding = await holdings_col.find_one({"user_email": user_email, "symbol": sym})
        if not existing_holding or int(existing_holding["quantity"]) < quantity:
            avail_qty = int(existing_holding["quantity"]) if existing_holding else 0
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient holdings to sell {quantity} shares of {sym}. You currently own {avail_qty} shares."
            )
            
        old_qty = int(existing_holding["quantity"])
        old_avg = float(existing_holding["avg_buy_price"])
        
        # Calculate realized P/L on sold shares
        realized_pl = (current_price - old_avg) * quantity
        
        # Add proceeds to cash
        new_cash = cash + total_order_value
        await portfolios_col.update_one({"user_email": user_email}, {"$set": {"cash": new_cash}})
        
        # Update holding
        new_qty = old_qty - quantity
        if new_qty == 0:
            await holdings_col.delete_one({"_id": existing_holding["_id"]})
        else:
            await holdings_col.update_one(
                {"_id": existing_holding["_id"]},
                {"$set": {
                    "quantity": new_qty,
                    "total_invested": round(new_qty * old_avg, 2),
                    "updated_at": datetime.now(timezone.utc)
                }}
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported trade action: '{action}'. Must be BUY or SELL."
        )

    # Log trade record in MongoDB
    trade_doc = {
        "user_email": user_email,
        "symbol": sym,
        "type": action,
        "quantity": quantity,
        "price": round(current_price, 2),
        "total_amount": round(total_order_value, 2),
        "realized_pl": round(realized_pl, 2) if action == "SELL" else 0.0,
        "ai_signal_at_trade": signal_info.get("signal") if signal_info else "N/A",
        "confidence": signal_info.get("confidence") if signal_info else 0.0,
        "timestamp": datetime.now(timezone.utc)
    }
    await trades_col.insert_one(trade_doc)
    
    # Recalculate portfolio
    summary = await calculate_live_portfolio(user_email)
    
    return {
        "success": True,
        "message": f"Successfully executed paper {action} order for {quantity} shares of {sym} at ₹{round(current_price, 2)}",
        "trade": {
            "symbol": sym,
            "type": action,
            "quantity": quantity,
            "price": round(current_price, 2),
            "total_amount": round(total_order_value, 2),
            "realized_pl": round(realized_pl, 2),
            "timestamp": trade_doc["timestamp"].isoformat()
        },
        "portfolio": summary
    }

async def reset_user_portfolio(user_email: str) -> Dict[str, Any]:
    """Resets user's paper portfolio to the initial ₹1,00,000 virtual capital."""
    holdings_col = get_collection("holdings")
    trades_col = get_collection("trades")
    portfolios_col = get_collection("portfolios")
    
    await holdings_col.delete_many({"user_email": user_email})
    await trades_col.delete_many({"user_email": user_email})
    
    reset_data = {
        "user_email": user_email,
        "cash": settings.INITIAL_VIRTUAL_CAPITAL,
        "initial_capital": settings.INITIAL_VIRTUAL_CAPITAL,
        "total_value": settings.INITIAL_VIRTUAL_CAPITAL,
        "invested_capital": 0.0,
        "total_pl": 0.0,
        "total_pl_percent": 0.0,
        "today_pl": 0.0,
        "updated_at": datetime.now(timezone.utc)
    }
    await portfolios_col.update_one(
        {"user_email": user_email},
        {"$set": reset_data},
        upsert=True
    )
    
    return {
        "success": True,
        "message": f"Portfolio reset successfully to initial virtual balance of ₹{settings.INITIAL_VIRTUAL_CAPITAL:,.2f}",
        "portfolio": reset_data
    }
