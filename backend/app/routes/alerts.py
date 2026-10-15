import logging
from datetime import datetime, timezone
from typing import Optional, List
from bson import ObjectId
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from app.database import get_collection
from app.security import get_optional_current_user
from app.services.market_data import get_stock_quote

logger = logging.getLogger("trademind.routes.alerts")
router = APIRouter(prefix="/alerts", tags=["Smart Alerts"])

class CreateAlertRequest(BaseModel):
    symbol: str
    condition_type: str = Field(..., pattern="^(PRICE_ABOVE|PRICE_BELOW|SIGNAL_BUY|SIGNAL_SELL|CONFIDENCE_ABOVE)$")
    threshold_value: float = Field(default=0.0)
    email: Optional[str] = None

@router.get("")
async def get_alerts(
    email: Optional[str] = None,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """Retrieves all smart alerts created by the user."""
    user_email = (current_user.get("email") if current_user else email) or "demo@trademind.ai"
    clean_email = user_email.lower().strip()
    
    col = get_collection("alerts")
    cursor = col.find({"user_email": clean_email}).sort("created_at", -1)
    
    alerts = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        doc.pop("_id", None)
        if "created_at" in doc and hasattr(doc["created_at"], "isoformat"):
            doc["created_at"] = doc["created_at"].isoformat()
        if "triggered_at" in doc and doc["triggered_at"] and hasattr(doc["triggered_at"], "isoformat"):
            doc["triggered_at"] = doc["triggered_at"].isoformat()
        alerts.append(doc)
        
    return {"alerts": alerts}

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_alert(
    req: CreateAlertRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """Creates a new smart alert stored in MongoDB."""
    user_email = (current_user.get("email") if current_user else req.email) or "demo@trademind.ai"
    clean_email = user_email.lower().strip()
    sym = req.symbol.upper().strip()
    
    col = get_collection("alerts")
    new_alert = {
        "user_email": clean_email,
        "symbol": sym,
        "condition_type": req.condition_type,
        "threshold_value": req.threshold_value,
        "is_active": True,
        "is_triggered": False,
        "triggered_at": None,
        "trigger_message": None,
        "created_at": datetime.now(timezone.utc)
    }
    
    insert_res = await col.insert_one(new_alert)
    new_alert["id"] = str(insert_res.inserted_id)
    new_alert.pop("_id", None)
    new_alert["created_at"] = new_alert["created_at"].isoformat()
    
    return {"success": True, "alert": new_alert}

@router.delete("/{id}")
async def delete_alert(
    id: str,
    email: Optional[str] = None,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """Deletes an alert by ID."""
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Alert ID")
        
    col = get_collection("alerts")
    res = await col.delete_one({"_id": obj_id})
    return {"success": True, "deleted_count": res.deleted_count}

@router.post("/check")
async def evaluate_alerts(
    email: Optional[str] = None,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """
    Evaluates active alerts against current market prices and AI signals.
    Marks triggered alerts in MongoDB and returns list of notifications.
    """
    user_email = (current_user.get("email") if current_user else email) or "demo@trademind.ai"
    clean_email = user_email.lower().strip()
    
    alerts_col = get_collection("alerts")
    signals_col = get_collection("signals")
    
    active_alerts = await alerts_col.find({"user_email": clean_email, "is_active": True}).to_list(100)
    triggered = []
    
    for alert in active_alerts:
        sym = alert["symbol"]
        cond = alert["condition_type"]
        thresh = alert.get("threshold_value", 0.0)
        
        try:
            quote = await get_stock_quote(sym)
            cur_price = quote["current_price"]
            
            sig_doc = await signals_col.find_one({"symbol": sym})
            cur_signal = sig_doc.get("signal", "HOLD") if sig_doc else "HOLD"
            cur_conf = sig_doc.get("confidence", 50.0) if sig_doc else 50.0
            
            is_hit = False
            msg = ""
            
            if cond == "PRICE_ABOVE" and cur_price >= thresh:
                is_hit = True
                msg = f"{sym} reached ₹{cur_price}, crossing above target of ₹{thresh}"
            elif cond == "PRICE_BELOW" and cur_price <= thresh:
                is_hit = True
                msg = f"{sym} reached ₹{cur_price}, falling below target of ₹{thresh}"
            elif cond == "SIGNAL_BUY" and cur_signal == "BUY":
                is_hit = True
                msg = f"TradeMind AI generated a 🟢 BUY signal for {sym} (Confidence: {cur_conf}%)"
            elif cond == "SIGNAL_SELL" and cur_signal == "SELL":
                is_hit = True
                msg = f"TradeMind AI generated a 🔴 SELL signal for {sym} (Confidence: {cur_conf}%)"
            elif cond == "CONFIDENCE_ABOVE" and cur_conf >= thresh:
                is_hit = True
                msg = f"{sym} AI signal confidence reached {cur_conf}%, exceeding {thresh}% threshold"
                
            if is_hit and not alert.get("is_triggered"):
                now = datetime.now(timezone.utc)
                await alerts_col.update_one(
                    {"_id": alert["_id"]},
                    {"$set": {
                        "is_triggered": True,
                        "triggered_at": now,
                        "trigger_message": msg
                    }}
                )
                triggered.append({
                    "id": str(alert["_id"]),
                    "symbol": sym,
                    "condition": cond,
                    "message": msg,
                    "timestamp": now.isoformat()
                })
        except Exception as e:
            logger.warning(f"Error checking alert {alert.get('_id')}: {e}")
            
    return {"checked_count": len(active_alerts), "new_triggers": triggered}
