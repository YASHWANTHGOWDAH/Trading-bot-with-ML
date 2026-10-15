# TradeMind AI — Explainable Machine Learning-Based Real-Time Market Analytics and Paper Trading Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_19_Vite-61DAFB.svg?logo=react&logoColor=black)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB_Only-47A248.svg?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Scikit-Learn](https://img.shields.io/badge/ML-Scikit--Learn-F7931E.svg?logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **Final-Year Engineering Major Project**
> An end-to-end, full-stack paper trading and quantitative market analytics platform powered by explainable machine learning.

---

## 🌟 Executive Overview

**TradeMind AI** combines statistical machine learning, quantitative technical indicators, and explainable AI (XAI) to generate actionable 🟢 **BUY**, 🔴 **SELL**, and 🟡 **HOLD** equity signals. Unlike conventional black-box trading algorithms, TradeMind AI presents a transparent, evidence-based reasoning checklist showing *why* each directional call was made. 

Traders can practice risk-free paper trading with an initial **₹1,00,000** in virtual capital, backtest algorithmic strategies over historical candle series, configure reactive smart alerts, and monitor prioritized watchlists on a glassmorphism fintech UI.

---

## 🚀 Key Features

* **Interactive Recharts Visualization**: Candlestick/line visualization supporting 1D, 1W, 1M, 3M, 6M, and 1Y timeframes with SMA20, SMA50, and Volume overlays.
* **Trained AI Copilot Chatbot**: Real-time conversational assistant grounded in live stock quotes, ML predictions, and technical indicators. Answers queries on stock signals, indicator math, and portfolio health with MongoDB conversation persistence.
* **Explainable AI (XAI) Engine**: Converts Random Forest predictions and technical boundaries into human-readable rationale (e.g., *"Price is above SMA20"*, *"MACD histogram positive (+0.35)"*, *"ML predicts 82% upward probability"*).
* **Dual-Conviction Signal Logic**:
  * 🟢 **BUY**: Upward probability $\ge 58\%$ confirmed by at least 2 bullish indicators.
  * 🔴 **SELL**: Downward probability $\ge 58\%$ confirmed by at least 2 bearish indicators.
  * 🟡 **HOLD**: Mixed indicators or model directional uncertainty.
* **Paper Trading Terminal**: Virtual trading simulator with ₹1,00,000 initial capital, real-time holdings tracking, weighted average cost accounting, and realized P/L ledgers.
* **Quantitative Backtesting Lab**: Run walk-forward simulations across historical data. Generates final equity, total return %, win rate %, max drawdown %, and visual portfolio equity curves.
* **Pure MongoDB Persistence**: Exclusively uses MongoDB (NoSQL) for storing users, market data, predictions, signals, trades, holdings, portfolios, watchlists, backtests, and alerts.
* **Enterprise Security**: Argon2 password hashing (`argon2-cffi`) and JWT authentication.
* **Mobile-Responsive Design**: Adaptive glassmorphism dark theme with mobile navigation drawers and touch-optimized buttons.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, React Router v7, Axios, Recharts, Lucide React, HTML5, CSS3 Glassmorphism |
| **Backend** | Python 3.11, FastAPI, Pydantic v2, Motor (Async MongoDB), PyJWT, Argon2-cffi, Uvicorn |
| **Machine Learning** | NumPy, Pandas, Scikit-learn (RandomForestClassifier, StandardScaler) |
| **Database** | MongoDB (NoSQL only — No PostgreSQL) |

---

## 📁 Project Directory Structure

```text
TradeMind-AI/
│
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entrypoint & lifespan
│   │   ├── config.py            # Settings & environment variables
│   │   ├── database.py          # Async Motor MongoDB connection & indexes
│   │   ├── security.py          # Argon2 hashing & JWT authentication
│   │   │
│   │   ├── routes/              # Modular API endpoints
│   │   │   ├── auth.py          # /api/auth/register, /api/auth/login, /api/auth/me
│   │   │   ├── market.py        # /api/market/symbols, /api/market/{symbol}, /history
│   │   │   ├── ai.py            # /api/ai/analysis/{symbol}, /signals/all
│   │   │   ├── paper.py         # /api/paper/trade, /history/{email}, /holdings
│   │   │   ├── portfolio.py     # /api/portfolio/summary/{email}, /reset
│   │   │   ├── backtest.py      # /api/backtest, /api/backtest/{id}
│   │   │   ├── watchlist.py     # /api/watchlist, /api/watchlist/{symbol}
│   │   │   └── alerts.py        # /api/alerts, /api/alerts/check
│   │   │
│   │   └── services/            # Core business & algorithmic logic
│   │       ├── market_data.py   # Historical OHLCV fetcher & synthetic generator
│   │       ├── indicators.py    # SMA20, SMA50, RSI, MACD, Returns, Volatility
│   │       ├── ml.py            # Supervised RandomForest model pipeline
│   │       ├── signal_engine.py # Signal conviction & Explainable AI reason generator
│   │       ├── backtesting.py   # Walk-forward quantitative strategy simulation
│   │       └── portfolio.py     # Virtual accounting & P/L calculation engine
│   │
│   ├── requirements.txt         # Backend Python dependencies
│   ├── test_system.py           # Automated end-to-end integration test
│   ├── Dockerfile               # Backend container configuration
│   ├── .env.example             # Template environment variables
│   └── .env                     # Local environment settings
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # Header with virtual cash badge & navigation
│   │   │   └── AIChartBox.jsx   # AI Market Signal card with explainability
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx    # Main fintech dashboard & interactive chart
│   │   │   ├── Markets.jsx      # Multi-stock screener with AI signal cards
│   │   │   ├── AIAnalyst.jsx    # Deep dive into indicators & ML features
│   │   │   ├── PaperTrading.jsx # Virtual order execution terminal
│   │   │   ├── Portfolio.jsx    # Live portfolio metrics & asset allocation chart
│   │   │   ├── BacktestLab.jsx  # Strategy simulator with growth equity curve
│   │   │   ├── Watchlist.jsx    # Prioritized stock tracking
│   │   │   ├── Alerts.jsx       # Smart price and signal notification rules
│   │   │   ├── Settings.jsx     # Profile & ML parameter audit
│   │   │   ├── Login.jsx        # JWT login with password toggle
│   │   │   └── Register.jsx     # Registration with password strength meter
│   │   │
│   │   ├── charts/
│   │   │   └── StockChart.jsx   # Interactive Recharts component
│   │   │
│   │   ├── services/
│   │   │   └── api.js           # Axios API client with auth interceptors
│   │   │
│   │   ├── App.jsx              # Main routing & state coordinator
│   │   ├── index.css            # Dark theme glassmorphism styling
│   │   └── main.jsx             # React DOM root entry
│   │
│   ├── package.json             # Frontend NPM dependencies
│   ├── vite.config.js           # Vite configuration with backend proxy
│   └── Dockerfile               # Frontend container configuration
│
├── database/
│   └── collections.md           # MongoDB collection schemas & sample docs
│
├── docs/
│   └── PROJECT.md               # 23-chapter Academic Major Project Report
│
├── docker-compose.yml           # Full-stack Docker composition
└── README.md                    # Project manual & setup guide
```

---

## 🪟 Windows Setup Instructions (Step-by-Step)

Follow these exact steps to run TradeMind AI on Windows (PowerShell or Command Prompt):

### Step 1: Install Prerequisites
1. **Python 3.10+**: Download from [python.org](https://www.python.org/downloads/). *(Ensure "Add Python to PATH" is checked during installation).*
2. **Node.js (v18+)**: Download from [nodejs.org](https://nodejs.org/).
3. **MongoDB Community Server**: Download from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community) and install as a Windows Service (default port: `27017`).

### Step 2: Open Project in VS Code
Open the project root directory in VS Code:
```powershell
cd TradeMind-AI
code .
```

### Step 3: Setup Backend Environment
Open a PowerShell terminal in VS Code:
```powershell
# Navigate to backend
cd backend

# (Optional) Create Python virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install required Python packages
python -m pip install -r requirements.txt

# Verify MongoDB and backend dependencies
python test_system.py
```
*You should see:* `>>> ALL BACKEND PIPELINES AND MONGODB PERSISTENCE VERIFIED SUCCESSFULLY! <<<`

### Step 4: Start the FastAPI Backend
```powershell
# In the backend directory:
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
*The backend API will start at: `http://127.0.0.1:8000` (Swagger docs at `http://127.0.0.1:8000/docs`).*

### Step 5: Start the React Frontend
Open a **second** terminal window in VS Code:
```powershell
# Navigate to frontend
cd frontend

# Install frontend packages (if not already installed)
npm install

# Start Vite development server
npm run dev
```
*The frontend will start at: `http://localhost:5173`.*

### Step 6: Open the Application
Open your web browser and navigate to:
```text
http://localhost:5173
```
You can register a new account or immediately explore demo paper trading with pre-allocated ₹1,00,000 virtual balance.

---

## 🐳 Docker Deployment (Alternative)

If you have Docker Desktop installed on Windows, you can start the entire stack (MongoDB + Backend + Frontend) with one command:
```powershell
docker compose up --build
```
Access the application at `http://localhost:5173`.

---

## 🔌 API Documentation Reference

All endpoints are prefixed with `/api`. Interactive Swagger UI is available at `http://localhost:8000/docs`.

### Authentication
* `POST /api/auth/register` — Create user account, hash password with Argon2, provision ₹1,00,000 paper portfolio.
* `POST /api/auth/login` — Authenticate user and issue JWT Bearer token.
* `GET /api/auth/me` — Retrieve current authenticated user profile.

### Market Data
* `GET /api/market/symbols` — List of supported stocks (AAPL, MSFT, NVDA, TSLA, AMZN, GOOGL, RELIANCE, TCS, INFY).
* `GET /api/market/overview` — Live quotes and 24h performance across universe.
* `GET /api/market/{symbol}` — Real-time price, high, low, volume, and technical indicators for a ticker.
* `GET /api/market/{symbol}/history?timeframe=1M` — Historical OHLCV candles enriched with SMA20, SMA50, RSI, MACD.

### AI & Explainable Signals
* `GET /api/ai/analysis/{symbol}` — Full Explainable AI analysis (Signal, Confidence %, Probabilities, Reason Bullets, Feature Importances).
* `GET /api/ai/signal/{symbol}` — Fast lookup of active BUY/SELL/HOLD signal.
* `GET /api/ai/signals/all` — Current signals for all stocks in the universe.
* `GET /api/ai/predictions/history/{symbol}` — Immutable prediction audit trail from MongoDB.

### Paper Trading & Portfolio
* `POST /api/paper/trade` — Execute virtual BUY or SELL paper order.
* `GET /api/paper/portfolio/{email}` — Real-time portfolio valuation and holding positions.
* `GET /api/paper/history/{email}` — Chronological order ledger from MongoDB `trades` collection.
* `POST /api/portfolio/reset/{email}` — Reset user paper trading account to ₹1,00,000.

### Backtesting Lab
* `POST /api/backtest` — Run strategy backtest over historical candles.
* `GET /api/backtest/{id}` — Retrieve previous backtest report and equity curve.

### Watchlists & Alerts
* `GET /api/watchlist` / `POST /api/watchlist` / `DELETE /api/watchlist/{symbol}` — Manage user watchlist.
* `GET /api/alerts` / `POST /api/alerts` / `DELETE /api/alerts/{id}` — Manage smart price/signal alerts.
* `POST /api/alerts/check` — Scan market conditions and mark triggered alerts.

---

## 🧠 Machine Learning & Explainable AI Methodology

### Feature Pipeline
The model processes 13 engineered features extracted from historical candles:
1. Price: `open`, `high`, `low`, `close`
2. Volume: `volume`
3. Trend: `sma20`, `sma50`, `sma_gap` ($\frac{\text{SMA}_{20} - \text{SMA}_{50}}{\text{SMA}_{50}} \times 100$)
4. Momentum: `rsi` (Wilder 14-period smoothed), `macd`, `macd_hist`
5. Volatility: `volatility` (20-period rolling std of returns)
6. Returns: `recent_return_1d`

### Model Training
- **Algorithm**: `RandomForestClassifier(n_estimators=100, max_depth=5, class_weight='balanced', random_state=42)`.
- **Chronological Split**: 80% train / 20% test to eliminate lookahead bias.
- **Scaling**: `StandardScaler` fitted on training partition only.
- **Probabilities**: Estimates $P(\text{UP})$ and $P(\text{DOWN})$.

### Explainable Reasoning Engine
The system bridges statistical outputs with human understanding:
```text
┌────────────────────────────────────────────────────────┐
│ Why BUY?                                               │
├────────────────────────────────────────────────────────┤
│ ✓ Price (₹225.43) is trading above SMA20 (₹221.80)     │
│ ✓ SMA20 is above SMA50 (1.56% gap showing uptrend)    │
│ ✓ MACD histogram is positive (+0.35) confirming momentum│
│ ✓ RSI (62.4) shows steady accumulation                 │
│ ✓ Recent 24h return is positive (+1.04%)              │
│ ✓ Random Forest ML assigns 82.0% upward probability    │
└────────────────────────────────────────────────────────┘
```

---

## 💾 MongoDB Database Architecture

TradeMind AI connects to `trademind_ai` database across 10 collections:
* `users` — Unique index on `email`, password hashes.
* `market_data` — Compound index `(symbol, timeframe)`.
* `predictions` — Audit log of every ML inference.
* `signals` — Latest active signal per ticker.
* `trades` — Immutable paper trading execution ledger.
* `holdings` — Active positions and average cost basis.
* `portfolios` — Account balances and total P/L.
* `watchlists` — Saved stocks per user.
* `backtests` — Backtest reports and growth equity curves.
* `alerts` — Condition notification triggers.

*(See [database/collections.md](database/collections.md) for complete JSON schemas).*

---

## 🧪 Testing Instructions

Run the automated backend integration test:
```powershell
cd TradeMind-AI\backend
python test_system.py
```
This script tests:
1. Connecting to MongoDB server on port 27017.
2. Market data ingestion & indicator calculation.
3. Random Forest inference and Explainable AI reason generation.
4. Virtual paper BUY/SELL execution and cash deduction.
5. Backtest engine simulation with 6-month walk-forward data.

To test the frontend build:
```powershell
cd TradeMind-AI\frontend
npm run build
```

---

## 🔮 Future Scope

1. **Recurrent & Transformer Models**: Add LSTM / Temporal Fusion Transformers (TFT) architectures alongside Random Forest.
2. **Sentiment Analysis**: Integrate NLP sentiment parsing from financial news headlines and SEC filings.
3. **Brokerage Webhooks**: Add direct paper-to-live bridge for brokerages (Zerodha Kite Connect, Alpaca).
4. **Options & Multi-Asset**: Extend analytics to commodities, forex, and options Greeks.

---

## 📄 Academic Project Attribution

* **Project Title**: Trading bot with machine learning: Explainable Machine Learning-Based Real-Time Market Analytics and Paper Trading Platform
* **Application Name**: TradeMind AI
* **Documentation**: See [docs/PROJECT.md](docs/PROJECT.md) for the 23-chapter Major Project Report.
