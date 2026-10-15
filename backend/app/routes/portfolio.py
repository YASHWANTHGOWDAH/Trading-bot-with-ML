import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from app.services.portfolio import calculate_live_portfolio, reset_user_portfolio

logger = logging.getLogger("trademind.routes.portfolio")
router = APIRouter(prefix="/portfolio", tags=["Portfolio Management"])

@router.get("/summary/{email}")
async def get_portfolio_summary(email: str):
    """
    Returns complete fintech portfolio summary:
    - Total Portfolio Value
    - Available Virtual Cash
    - Total Invested Amount
    - Today's P/L
    - Total Overall P/L and %
    - Enriched holdings with current quotes
    - Asset allocation breakdown
    """
    clean_email = email.lower().strip()
    summary = await calculate_live_portfolio(clean_email)
    
    # Calculate asset allocation percentages
    total_val = summary["total_value"]
    cash = summary["cash"]
    allocation = []
    
    if total_val > 0:
        allocation.append({
            "name": "Cash",
            "value": round(cash, 2),
            "percentage": round((cash / total_val) * 100.0, 1),
            "color": "#10B981"
        })
        
        colors = ["#3B82F6", "#8B5CF6", "#F59E0B", "#EC4899", "#06B6D4", "#84CC16"]
        for idx, h in enumerate(summary.get("holdings", [])):
            val = h["current_value"]
            allocation.append({
                "name": h["symbol"],
                "value": round(val, 2),
                "percentage": round((val / total_val) * 100.0, 1),
                "color": colors[idx % len(colors)]
            })
            
    summary["allocation"] = allocation
    return summary

@router.post("/reset/{email}")
async def reset_portfolio(email: str):
    """Resets user's paper trading portfolio back to the initial ₹1,00,000 virtual balance."""
    clean_email = email.lower().strip()
    res = await reset_user_portfolio(clean_email)
    return res
