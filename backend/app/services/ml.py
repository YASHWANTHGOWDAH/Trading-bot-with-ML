import logging
from typing import Dict, Any, Tuple
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score

logger = logging.getLogger("trademind.ml")

FEATURE_COLUMNS = [
    "open",
    "high",
    "low",
    "close",
    "volume",
    "sma20",
    "sma50",
    "rsi",
    "macd",
    "macd_hist",
    "recent_return_1d",
    "volatility",
    "sma_gap"
]

def prepare_ml_dataset(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series, pd.DataFrame]:
    """
    Prepares features X and binary target y (1 for UP, 0 for DOWN in next period).
    Returns (X, y, latest_row_features).
    """
    data = df.copy()
    
    # Target: 1 if next candle close is higher than current candle close
    data["target"] = (data["close"].shift(-1) > data["close"]).astype(int)
    
    # Clean missing values
    for col in FEATURE_COLUMNS:
        if col not in data.columns:
            data[col] = 0.0
        data[col] = data[col].ffill().bfill().fillna(0.0)
        
    # The last row has no future target, so it is used for current inference
    latest_features = data.iloc[[-1]][FEATURE_COLUMNS].copy()
    
    # Historical training rows (all rows except last)
    train_data = data.iloc[:-1].copy()
    
    X = train_data[FEATURE_COLUMNS]
    y = train_data["target"]
    
    return X, y, latest_features

def train_and_predict(df: pd.DataFrame, model_type: str = "RandomForest") -> Dict[str, Any]:
    """
    Executes ML training pipeline with chronological split and predicts direction for latest bar.
    """
    if len(df) < 15:
        # Fallback for very small datasets
        return {
            "model_name": model_type,
            "prediction": "UP",
            "up_probability": 0.55,
            "down_probability": 0.45,
            "confidence": 0.55,
            "accuracy": 0.60,
            "feature_importances": {},
            "status": "INSUFFICIENT_DATA_FALLBACK"
        }
        
    X, y, latest_X = prepare_ml_dataset(df)
    
    # Chronological Split (80% train, 20% test to prevent lookahead bias)
    n_samples = len(X)
    split_idx = max(int(n_samples * 0.8), 5)
    
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
    
    # Feature Scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test) if len(X_test) > 0 else X_train_scaled
    latest_X_scaled = scaler.transform(latest_X)
    
    # Initialize Model (expandable for XGBoost/LSTM)
    if model_type == "RandomForest":
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=5,
            min_samples_split=4,
            random_state=42,
            class_weight="balanced"
        )
    else:
        # Default Random Forest
        model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
        
    # Fit model on training set
    model.fit(X_train_scaled, y_train)
    
    # Evaluate
    train_pred = model.predict(X_train_scaled)
    train_acc = accuracy_score(y_train, train_pred)
    
    if len(y_test) > 0:
        test_pred = model.predict(X_test_scaled)
        test_acc = accuracy_score(y_test, test_pred)
    else:
        test_acc = train_acc
        
    # Predict probabilities for the current (latest) bar
    probabilities = model.predict_proba(latest_X_scaled)[0]
    classes = model.classes_
    
    down_prob = 0.5
    up_prob = 0.5
    for idx, cls in enumerate(classes):
        if cls == 0:
            down_prob = float(probabilities[idx])
        elif cls == 1:
            up_prob = float(probabilities[idx])
            
    # Feature importance mapping
    importances = {}
    if hasattr(model, "feature_importances_"):
        for name, imp in zip(FEATURE_COLUMNS, model.feature_importances_):
            importances[name] = round(float(imp), 4)
            
    # Sort feature importances descending
    sorted_importances = dict(sorted(importances.items(), key=lambda item: item[1], reverse=True))

    return {
        "model_name": model_type,
        "up_probability": round(up_prob, 4),
        "down_probability": round(down_prob, 4),
        "predicted_direction": "UP" if up_prob >= 0.50 else "DOWN",
        "train_accuracy": round(train_acc, 4),
        "test_accuracy": round(test_acc, 4),
        "feature_importances": sorted_importances,
        "n_samples": n_samples
    }
