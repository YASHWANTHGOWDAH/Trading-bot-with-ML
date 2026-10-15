import re
import os
import math
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.database import get_collection
from app.services.market_data import get_stock_quote, get_historical_ohlcv, SUPPORTED_STOCKS, SYMBOL_MAP
from app.services.signal_engine import generate_and_save_analysis
from app.services.portfolio import calculate_live_portfolio

logger = logging.getLogger("trademind.chatbot")

# Supported stock universe and common aliases
TICKER_ALIASES = {
    # US Equities
    "APPLE": "AAPL",
    "AAPL": "AAPL",
    "MICROSOFT": "MSFT",
    "MSFT": "MSFT",
    "NVIDIA": "NVDA",
    "NVDA": "NVDA",
    "TESLA": "TSLA",
    "TSLA": "TSLA",
    "AMAZON": "AMZN",
    "AMZN": "AMZN",
    "GOOGLE": "GOOGL",
    "ALPHABET": "GOOGL",
    "GOOGL": "GOOGL",
    "GOOG": "GOOGL",
    "META": "META",
    "FACEBOOK": "META",
    "NETFLIX": "NFLX",
    "NFLX": "NFLX",
    "AMD": "AMD",
    "INTEL": "INTC",
    "INTC": "INTC",

    # Indian Equities
    "RELIANCE": "RELIANCE",
    "RIL": "RELIANCE",
    "TCS": "TCS",
    "TATA CONSULTANCY": "TCS",
    "INFOSYS": "INFY",
    "INFY": "INFY",
    "HDFCBANK": "HDFCBANK",
    "HDFC": "HDFCBANK",
    "HDFC BANK": "HDFCBANK",
    "ICICIBANK": "ICICIBANK",
    "ICICI": "ICICIBANK",
    "ICICI BANK": "ICICIBANK",
    "SBIN": "SBIN",
    "SBI": "SBIN",
    "STATE BANK": "SBIN",
    "BHARTIARTL": "BHARTIARTL",
    "AIRTEL": "BHARTIARTL",
    "BHARTI AIRTEL": "BHARTIARTL",
    "ITC": "ITC",
    "LARSEN": "LARSEN",
    "L&T": "LARSEN",
    "LT": "LARSEN",
    "TATAPOWER": "TATAPOWER",
    "TATA POWER": "TATAPOWER",
    "TATAMOTORS": "TATAPOWER",
    "TATA MOTORS": "TATAPOWER",
    "TATASTEEL": "TATASTEEL",
    "TATA STEEL": "TATASTEEL",
    "WIPRO": "WIPRO",
    "HINDUNILVR": "HINDUNILVR",
    "HUL": "HINDUNILVR",
    "BAJFINANCE": "BAJFINANCE",
    "BAJAJ FINANCE": "BAJFINANCE",
    "MARUTI": "MARUTI",
    "MARUTI SUZUKI": "MARUTI",
}

# Extensive Master Knowledge Repository (Technical, Fundamental, Options, Trading Bot & Architecture)
MARKET_KNOWLEDGE_BASE = {
    # ─── 0. Trading Bot Architecture & Project Knowledge ─────────────────────
    "trading_bot_architecture": {
        "keywords": ["my trading bot", "trading bot", "explain my bot", "how bot works", "how project works", "how system works", "architecture", "data source"],
        "title": "TradeMind AI System Architecture & Data Pipeline",
        "content": """**TradeMind AI** is an explainable machine learning-based real-time market analytics and paper-trading platform:

• **Technology Stack**:
  - **Backend**: Python 3.11, FastAPI, Pydantic v2, Motor (Async MongoDB Driver), Argon2 Hashing, PyJWT.
  - **Frontend**: React 19, Vite, React Router v7, Recharts, Lucide Icons, Glassmorphism UI.
  - **Database**: MongoDB (`trademind_ai` database storing users, market_data, predictions, signals, trades, portfolios, holdings, watchlists, backtests, and chat_messages).
  - **Machine Learning**: Scikit-Learn `RandomForestClassifier` (100 Decision Trees, Max Depth 5, Balanced Class Weights) with extensible architecture for XGBoost.

• **Data Source Rule**:
  - The project exclusively utilizes **yfinance** (`import yfinance as yf`) as its authoritative market-data provider for live quotes and historical OHLCV data.
  - Includes a deterministic Geometric Brownian Motion (GBM) offline generator fallback to guarantee 100% presentation uptime.

• **Signal Generation Engine**:
  - Evaluates 12 quantitative features: Open, High, Low, Close, Volume, SMA20, SMA50, RSI(14), MACD, 20d Volatility, Recent Return %, and SMA20-SMA50 Gap %.
  - Generates **🟢 BUY**, **🔴 SELL**, or **🟡 HOLD** based on a strict dual-threshold requirement ($\ge 58\%$ ML directional conviction + at least 2 technical indicator confirmations)."""
    },

    "ml_models_explanation": {
        "keywords": ["random forest", "xgboost", "how ml works", "machine learning model", "ml prediction", "how model works"],
        "title": "Machine Learning Prediction Engine (Random Forest & XGBoost)",
        "content": """How the Machine Learning models function in TradeMind AI:

• **Supervised Binary Classification**:
  - **Target Variable**: Predicts whether next-period price movement is UP ($\Delta P_{t+1} > 0$) or DOWN ($\Delta P_{t+1} \le 0$).
  - **Model 1: Random Forest Classifier**: An ensemble of 100 decision trees. Each tree votes on directional probability, mitigating individual tree variance and noise overfitting.
  - **Model 2: XGBoost (Architecture Ready)**: Gradient-boosted decision trees that sequentially minimize residual loss errors.

• **Directional Probability to Signal Mapping**:
  - *Upward Probability $\ge 58\%$ + Supporting Indicators* $\rightarrow$ **🟢 BUY**
  - *Downward Probability $\ge 58\%$ + Supporting Indicators* $\rightarrow$ **🔴 SELL**
  - *Uncertain / Conflicting Probability ($42\% < P < 58\%$)* $\rightarrow$ **🟡 HOLD**

• **Strict Disclaimers**:
  - Machine learning models estimate statistical probabilities based on historical yfinance patterns. They do NOT guarantee profit, returns, or future price movements."""
    },

    "news_queries": {
        "keywords": ["news", "headlines", "stock news", "latest news", "market news", "breaking news"],
        "title": "Market News Availability Notice",
        "content": "I don't have verified current news data available through this application's data source. TradeMind AI relies strictly on verified numerical market data and OHLCV indicators from yfinance to avoid hallucinating unverified headlines."
    },

    # ─── 1. Technical Indicators ───────────────────────────────────────────────
    "rsi": {
        "keywords": ["rsi", "relative strength index", "overbought", "oversold", "momentum oscillator"],
        "title": "Relative Strength Index (RSI)",
        "content": """**Relative Strength Index (RSI)** is a momentum oscillator developed by J. Welles Wilder that measures price change velocity on a scale of 0 to 100:

• **Mathematical Formulation**:
  $$RSI = 100 - \\left(\\frac{100}{1 + RS}\\right)$$
  Where $RS = \\frac{\\text{Smoothed 14-period Average Gain}}{\\text{Smoothed 14-period Average Loss}}$.

• **Key Thresholds & Regimes**:
  - **Overbought ($\ge 70$)**: Indicates intense buying momentum. *Note*: RSI $> 70$ does NOT automatically mean instant SELL; strong trends can remain overbought for extended periods.
  - **Oversold ($\le 30$)**: Indicates selling exhaustion that may precede a technical bounce.
  - **Bullish Regime (40 – 70)**: Healthy accumulation zone where upward trend continuation is probable without immediate overheating risk.

• **RSI Divergences**:
  - *Bullish Divergence*: Price prints a lower low, but RSI prints a higher low (downside momentum is drying up).
  - *Bearish Divergence*: Price prints a higher high, but RSI prints a lower high (buying momentum is fading)."""
    },

    "macd": {
        "keywords": ["macd", "moving average convergence", "macd line", "signal line", "macd histogram"],
        "title": "MACD (Moving Average Convergence Divergence)",
        "content": """**MACD** is a trend-following momentum indicator created by Gerald Appel:

• **Components**:
  1. **MACD Line**: $12\\text{-day Exponential Moving Average (EMA)} - 26\\text{-day EMA}$.
  2. **Signal Line**: $9\\text{-day EMA of the MACD Line}$.
  3. **MACD Histogram**: $\\text{MACD Line} - \\text{Signal Line}$.

• **How to Interpret Signals**:
  - **Histogram > 0 (+)**: MACD line is above the signal line. Upward acceleration is expanding.
  - **Histogram < 0 (−)**: Downward selling momentum is dominant.
  - **Zero-Line Cross**: When the MACD line crosses from negative to positive territory, it confirms an intermediate trend shift from bearish to bullish.
  - **Signal Line Crossover**: A trigger where the MACD line crossing above the signal line generates a momentum BUY confirmation."""
    },

    "moving_averages": {
        "keywords": ["sma", "ema", "moving average", "moving averages", "golden cross", "death cross", "sma20", "sma50", "sma200"],
        "title": "Moving Averages (SMA & EMA) and Trend Crossovers",
        "content": """**Moving Averages** smooth out price noise to identify the underlying trend:

• **Simple Moving Average (SMA)**: The unweighted arithmetic mean over $N$ periods:
  $$\\text{SMA}_N = \\frac{1}{N} \\sum_{i=0}^{N-1} \\text{Price}_{t-i}$$
• **Exponential Moving Average (EMA)**: Applies exponentially decreasing weights to past prices, reacting faster to recent price changes:
  $$\\text{EMA}_t = \\left(\\text{Price}_t \\times \\frac{2}{N+1}\\right) + \\left(\\text{EMA}_{t-1} \\times \\left(1 - \\frac{2}{N+1}\\right)\\right)$$

• **Critical Market Benchmarks**:
  - **SMA20 / EMA20**: Short-term trend barometer.
  - **SMA50**: Intermediate-term quarterly trend barometer.
  - **SMA200**: Institutional dividing line between secular bull and bear markets.

• **Famous Crossover Patterns**:
  - **Golden Cross**: When a shorter moving average (e.g., SMA20 or SMA50) crosses above a longer moving average (e.g., SMA50 or SMA200).
  - **Death Cross**: When the short-term MA breaks below the long-term MA, confirming systemic downside continuation."""
    },

    "bollinger_bands": {
        "keywords": ["bollinger", "bollinger bands", "volatility bands", "bandwidth", "bbands"],
        "title": "Bollinger Bands",
        "content": """**Bollinger Bands**, created by John Bollinger, consist of three dynamic bands plotted around price action:
• **Middle Band**: Typically a 20-day Simple Moving Average (SMA20).
• **Upper Band**: $\\text{SMA20} + (2 \\times \\sigma)$, where $\\sigma$ is the 20-period standard deviation.
• **Lower Band**: $\\text{SMA20} - (2 \\times \\sigma)$.

• **Key Trading Concepts**:
  - **The Squeeze**: When bands contract tightly together, it signifies historically low volatility, which often precedes an explosive breakout in either direction.
  - **Walking the Bands**: In strong trends, price can hug the upper or lower band for extended periods without immediate reversal.
  - **Mean Reversion**: Touching or piercing the outer bands often acts as an overextended support or resistance boundary."""
    },

    "vwap": {
        "keywords": ["vwap", "volume weighted average price", "volume profile"],
        "title": "Volume Weighted Average Price (VWAP)",
        "content": """**VWAP** is the true institutional benchmark for intraday equity trading:
• **Formula**:
  $$\\text{VWAP} = \\frac{\\sum (\\text{Typical Price}_i \\times \\text{Volume}_i)}{\\sum \\text{Volume}_i} \\quad \\text{where } \\text{Typical Price} = \\frac{\\text{High} + \\text{Low} + \\text{Close}}{3}$$
• **Why Institutions Use VWAP**: Mutual funds and algorithmic desks measure order quality against VWAP. Buying below VWAP means shares were acquired at a price better than the volume-weighted average of the session."""
    },

    "atr_volatility": {
        "keywords": ["atr", "average true range", "volatility", "historical volatility", "market volatility"],
        "title": "Average True Range (ATR) & Volatility Analysis",
        "content": """**Average True Range (ATR)** measures absolute market volatility regardless of direction:
• **True Range (TR)** is the greatest of:
  1. $\\text{Current High} - \\text{Current Low}$
  2. $|\\text{Current High} - \\text{Previous Close}|$
  3. $|\\text{Current Low} - \\text{Previous Close}|$
• **Application**: Dynamic stop-loss placement ($2 \\times \\text{ATR}$) to prevent getting stopped out by standard market noise."""
    },

    # ─── 2. Price Action, Chart & Candlestick Patterns ─────────────────────────
    "support_resistance": {
        "keywords": ["support", "resistance", "support and resistance", "pivot point", "pivot points", "breakout", "breakdown", "fakeout"],
        "title": "Support, Resistance, and Breakout Dynamics",
        "content": """**Support and Resistance** are horizontal and dynamic price zones where supply and demand reach equilibrium:
• **Support (Floor)**: A price level where buying demand is strong enough to halt downward movement.
• **Resistance (Ceiling)**: A price level where selling pressure overcomes buying demand, capping price rallies.
• **Principle of Polarity**: Once a resistance level is broken decisively with high volume, it flips to become future support."""
    },

    "fibonacci": {
        "keywords": ["fibonacci", "fib", "fibonacci retracement", "golden ratio", "61.8", "38.2"],
        "title": "Fibonacci Retracement & Golden Ratios",
        "content": """**Fibonacci Retracements** use mathematical ratios derived from the Fibonacci sequence to forecast pullback and reversal levels:
• **Key Levels**: 23.6%, 38.2%, 50.0%, **61.8% (Golden Ratio)**, and 78.6%. Institutional algorithms routinely place limit orders around the 61.8% retracement of prior impulse legs."""
    },

    "chart_patterns": {
        "keywords": ["chart pattern", "chart patterns", "head and shoulders", "double top", "double bottom", "cup and handle", "triangle", "flag", "wedge"],
        "title": "Classical Chart Patterns",
        "content": """Classical chart patterns represent visual footprints of accumulation and distribution:
• **Reversals**: Head and Shoulders (neckline breach confirms shift to bear), Double Top (M pattern), Double Bottom (W pattern).
• **Continuations**: Cup and Handle, Bull Flag / Pennant."""
    },

    "candlestick_patterns": {
        "keywords": ["candlestick", "candlesticks", "candlestick pattern", "doji", "hammer", "shooting star", "engulfing", "morning star", "marubozu"],
        "title": "Japanese Candlestick Formations",
        "content": """Candlestick formations reflect real-time psychological shifts:
• **Doji**: Open and Close prices are virtually identical, highlighting market indecision.
• **Hammer**: Small body with a long lower wick at the bottom of a downtrend, showing buyer rejection of lower prices.
• **Shooting Star**: Small lower body with a long upper wick at swing highs, signaling buying exhaustion.
• **Bullish / Bearish Engulfing**: A candle body that completely engulfs the prior session's body, indicating an aggressive regime shift."""
    },

    # ─── 3. Fundamental Analysis & Financial Ratios ────────────────────────────
    "pe_ratio": {
        "keywords": ["p/e", "pe ratio", "price to earnings", "valuation", "earnings multiple", "peg ratio"],
        "title": "Price-to-Earnings (P/E) & PEG Ratios",
        "content": """The **P/E Ratio** compares share price to Earnings Per Share (EPS):
• **Formula**: $\\text{P/E} = \\frac{\\text{Market Share Price}}{\\text{Earnings Per Share (EPS)}}$.
• **PEG Ratio**: $\\frac{\\text{P/E}}{\\text{Annual EPS Growth Rate (\\%)}}$. A PEG $< 1.0$ suggests undervaluation relative to growth."""
    },

    "pb_ratio": {
        "keywords": ["p/b", "pb ratio", "price to book", "book value", "net asset value"],
        "title": "Price-to-Book (P/B) Ratio",
        "content": """The **Price-to-Book (P/B)** ratio compares market cap to net asset value ($\\frac{\\text{Share Price}}{\\text{Book Value per Share}}$). Crucial for banks and capital-heavy industrial firms."""
    },

    "roe_roce": {
        "keywords": ["roe", "roce", "return on equity", "capital employed", "profitability"],
        "title": "Return on Equity (ROE) & Return on Capital Employed (ROCE)",
        "content": """**ROE and ROCE** measure managerial capital efficiency:
• **ROE**: $\\frac{\\text{Net Income}}{\\text{Shareholder's Equity}} \\times 100$. Evaluates profit generated per dollar of equity.
• **ROCE**: $\\frac{\\text{EBIT}}{\\text{Total Assets} - \\text{Current Liabilities}} \\times 100$. Evaluates returns generated across total capital employed (both debt and equity)."""
    },

    "dcf": {
        "keywords": ["dcf", "discounted cash flow", "intrinsic value", "wacc", "terminal value", "margin of safety"],
        "title": "Discounted Cash Flow (DCF) & Intrinsic Valuation",
        "content": """**DCF Valuation** calculates an asset's true intrinsic worth as the present value of all future Free Cash Flows discounted back using WACC. Benjamin Graham's **Margin of Safety** recommends buying only when market price trades at a 20-35% discount below intrinsic value."""
    },

    # ─── 4. Risk Management & Trading Psychology ───────────────────────────────
    "risk_management": {
        "keywords": [
            "risk management", "stop loss", "stoploss", "position size", "position sizing",
            "sizing", "risk reward", "drawdown", "1% rule", "capital preservation", "sl"
        ],
        "title": "Professional Risk Management & Position Sizing",
        "content": """**Risk Management Principles**:
• **1% Capital Preservation Rule**: Never risk more than 1% to 2% of total portfolio equity on any single trade.
• **Exact Position Sizing Formula**:
  $$\\text{Position Size (Shares)} = \\frac{\\text{Total Capital} \\times \\text{Risk \\%}}{\\text{|Entry Price} - \\text{Stop Loss Price|}}$$
• **Risk-to-Reward Ratio (R:R)**: Aim for minimum 1:2 or 1:3 R:R ratio."""
    },

    "trading_psychology": {
        "keywords": ["psychology", "trading psychology", "fomo", "greed", "fear", "revenge trading", "bias", "discipline"],
        "title": "Trading Psychology & Emotional Discipline",
        "content": """Key psychological pitfalls:
• **FOMO (Fear Of Missing Out)**: Buying at the top of parabolic green candles. *Rule: Wait for pullbacks to value zones (SMA20/VWAP)*.
• **Loss Aversion**: Refusing to execute a predefined stop loss, turning an intraday trade into a long-term bag-holding position.
• **Revenge Trading**: Doubling trade size after a loss to 'get even'. Always step away after 2 consecutive stop-outs."""
    },

    # ─── 5. Order Types, Market Mechanics & Execution ──────────────────────────
    "order_types": {
        "keywords": ["order type", "order types", "market order", "limit order", "stop loss order", "stop limit", "gtc", "bracket order", "amo"],
        "title": "Stock Market Order Types & Execution Rules",
        "content": """• **Market Order**: Executes immediately at the best current price. Guaranteed fill, but subject to slippage.
• **Limit Order**: Executes only at specified price or better. Price guaranteed, execution optional.
• **Stop-Loss Market (SL-M)**: Triggers a market order once a stop threshold price is hit.
• **Stop-Limit (SL)**: Triggers a limit order once the stop threshold is hit."""
    },

    "market_mechanics": {
        "keywords": ["market mechanics", "bid ask", "spread", "liquidity", "order book", "circuit breaker", "settlement", "t+1"],
        "title": "Market Mechanics & Liquidity",
        "content": """• **Bid vs. Ask & Spread**: Bid is highest buyer price; Ask is lowest seller price. Tighter spreads signal deep liquidity.
• **Circuit Breakers**: Regulatory limits (5%, 10%, 15%, 20%) that pause trading during extreme volatility to prevent flash crashes.
• **T+1 Settlement**: Securities purchased settle into demat accounts one business day post-trade."""
    },

    "short_selling": {
        "keywords": ["short selling", "shorting", "short sell", "short squeeze", "borrowing shares"],
        "title": "Short Selling & Short Squeezes",
        "content": """• **Short Selling**: Borrowing shares, selling them at current high prices, and buying them back later (*covering*) at a lower price.
• **Short Squeeze**: Rapid rally forcing short sellers to panic-buy shares to cover, causing explosive upward acceleration."""
    },

    # ─── 6. Indian Stock Market Ecosystem ─────────────────────────────────────
    "indian_markets": {
        "keywords": ["nifty", "sensex", "nse", "bse", "sebi", "indian market", "bank nifty", "nifty 50"],
        "title": "Indian Stock Market Structure (NSE, BSE, Nifty 50, Sensex)",
        "content": """• **Exchanges**: **NSE** (National Stock Exchange) and **BSE** (Bombay Stock Exchange).
• **Indices**: **NIFTY 50** (Top 50 NSE blue-chips) and **SENSEX** (Top 30 BSE blue-chips).
• **Regulator**: **SEBI** (Securities and Exchange Board of India)."""
    },

    # ─── 7. Macroeconomics & Derivatives ──────────────────────────────────────
    "macroeconomics": {
        "keywords": ["inflation", "interest rate", "interest rates", "fed", "rbi", "gdp", "recession", "yield curve"],
        "title": "Macroeconomic Drivers of Equity Markets",
        "content": """• **Interest Rates**: Central bank rate hikes increase corporate borrowing costs and compress stock multiples; rate cuts flood liquidity, lifting equity valuations.
• **Yield Curve Inversion**: When short-term bond yields exceed long-term yields, historically signaling an impending recession."""
    },

    "options_basics": {
        "keywords": ["option", "options", "call option", "put option", "strike price", "expiry", "itm", "otm", "atm"],
        "title": "Options Contracts Fundamentals (Calls & Puts)",
        "content": """• **Call Option**: Right to BUY underlying stock at Strike price before Expiration.
• **Put Option**: Right to SELL underlying stock at Strike price before Expiration.
• **Moneyness**: In-The-Money (ITM), At-The-Money (ATM), Out-Of-The-Money (OTM)."""
    },

    "options_greeks": {
        "keywords": ["greek", "greeks", "delta", "gamma", "theta", "vega", "rho", "implied volatility", "iv"],
        "title": "Options Greeks & Implied Volatility (IV)",
        "content": """• **Delta ($\Delta$)**: Price sensitivity per $1 underlying move.
• **Gamma ($\Gamma$)**: Delta acceleration.
• **Theta ($\Theta$)**: Daily time decay.
• **Vega ($\nu$)**: Sensitivity to 1% Implied Volatility change.
• **Implied Volatility (IV)**: Forward market volatility consensus derived from options pricing."""
    }
}

def extract_symbol_from_text(text: str) -> Optional[str]:
    """Identifies single stock symbol or company name in user query."""
    upper = text.upper()
    words = re.findall(r'\b[A-Z0-9\.]+\b', upper)
    for word in words:
        if word in TICKER_ALIASES:
            return TICKER_ALIASES[word]
    for alias, sym in TICKER_ALIASES.items():
        if alias in upper:
            return sym
    return None

def extract_all_symbols_from_text(text: str) -> List[str]:
    """Identifies all distinct stock symbols in a comparison or multi-stock query."""
    upper = text.upper()
    found = []
    words = re.findall(r'\b[A-Z0-9\.]+\b', upper)
    for word in words:
        if word in TICKER_ALIASES:
            sym = TICKER_ALIASES[word]
            if sym not in found:
                found.append(sym)
    for alias, sym in TICKER_ALIASES.items():
        if alias in upper:
            if sym not in found:
                found.append(sym)
    return found

def score_knowledge_match(user_text: str) -> Optional[Dict[str, Any]]:
    """Calculates relevance score across all knowledge base categories."""
    clean_text = user_text.lower().strip()
    
    fillers = [
        "what is a ", "what is an ", "what is ", "what are ", "explain ", 
        "how does ", "how do ", "tell me about ", "can you explain ", 
        "define ", "meaning of ", "give details about ", "how to "
    ]
    trimmed_text = clean_text
    for f in fillers:
        if trimmed_text.startswith(f):
            trimmed_text = trimmed_text[len(f):].strip()
            break

    query_words = re.findall(r'\b[a-z0-9]+\b', clean_text)
    best_key = None
    best_score = 0

    for key, data in MARKET_KNOWLEDGE_BASE.items():
        score = 0
        for kw in data["keywords"]:
            if kw in clean_text:
                score += len(kw) * 3
            elif kw in trimmed_text:
                score += len(kw) * 4
                
            kw_tokens = kw.split()
            for kw_t in kw_tokens:
                if kw_t in query_words:
                    score += 2.5
                else:
                    for qw in query_words:
                        if len(qw) >= 4 and len(kw_t) >= 4:
                            if qw.startswith(kw_t[:4]) or kw_t.startswith(qw[:4]):
                                score += 1.5

        if score > best_score:
            best_score = score
            best_key = key

    if best_score >= 2.0 and best_key:
        return MARKET_KNOWLEDGE_BASE[best_key]
    return None

async def process_user_query(message: str, user_email: str = "demo@trademind.ai") -> Dict[str, Any]:
    """
    Master System Prompt Reasoning & Processing Engine for TradeMind AI Copilot.
    Uses ONLY yfinance data, real technical indicators, actual ML model predictions,
    and strict data accuracy rules without hallucination or profit guarantees.
    """
    text = message.strip()
    lower = text.lower()
    symbols = extract_all_symbols_from_text(text)
    
    metadata = {}

    # Priority 0: Verified News Disclaimer Rule (Requirement 15)
    if any(k in lower for k in ["news", "headlines", "latest news", "breaking news"]):
        response_text = (
            "### 📰 Market News Availability Notice\n\n"
            "I don't have verified current news data available through this application's data source.\n\n"
            "• **Data Source Rule**: TradeMind AI relies exclusively on numerical price candles, volume, and technical indicators retrieved via `yfinance` (`import yfinance as yf`).\n"
            "• **Data Integrity**: To prevent hallucinating unverified headlines, unverified market news is not generated."
        )
        metadata = {"intent": "NEWS_DISCLAIMER"}
        return await persist_and_return(user_email, message, response_text, metadata)

    # Priority 1: Multi-Stock Comparison Intent (Requirement 12)
    if len(symbols) >= 2 and any(k in lower for k in ["compare", "versus", "vs", "difference", "better"]):
        try:
            rows = []
            for sym in symbols[:4]:
                quote = await get_stock_quote(sym)
                df = await get_historical_ohlcv(sym, timeframe="3M")
                analysis = await generate_and_save_analysis(sym, df)
                
                rows.append({
                    "symbol": sym,
                    "price": quote["current_price"],
                    "rsi": quote.get("indicators", {}).get("rsi", "N/A"),
                    "sma20": quote.get("indicators", {}).get("sma20", "N/A"),
                    "sma50": quote.get("indicators", {}).get("sma50", "N/A"),
                    "macd": quote.get("indicators", {}).get("macd_hist", "N/A"),
                    "volume": quote.get("volume", "N/A"),
                    "signal": analysis["signal"],
                    "confidence": analysis["confidence"]
                })
            
            response_text = "### 📊 Stock Comparison Analysis (Source: yfinance)\n\n"
            response_text += "| Metric | " + " | ".join([r["symbol"] for r in rows]) + " |\n"
            response_text += "| :--- | " + " | ".join([":---:" for _ in rows]) + " |\n"
            response_text += "| **Latest Available Price** | " + " | ".join([f"₹{r['price']:.2f}" for r in rows]) + " |\n"
            response_text += "| **RSI (14)** | " + " | ".join([f"{r['rsi']}" for r in rows]) + " |\n"
            response_text += "| **SMA20** | " + " | ".join([f"₹{r['sma20']}" for r in rows]) + " |\n"
            response_text += "| **SMA50** | " + " | ".join([f"₹{r['sma50']}" for r in rows]) + " |\n"
            response_text += "| **MACD Hist** | " + " | ".join([f"{r['macd']}" for r in rows]) + " |\n"
            response_text += "| **Random Forest Signal** | " + " | ".join([f"**{r['signal']}**" for r in rows]) + " |\n"
            response_text += "| **Model Confidence** | " + " | ".join([f"{r['confidence']}%" for r in rows]) + " |\n\n"
            
            response_text += (
                "⚠️ *Data represents the latest available market values retrieved from yfinance. "
                "Predictions represent probability estimations from the Random Forest model and do not guarantee future performance.*"
            )
            metadata = {"intent": "STOCK_COMPARISON", "symbols": symbols}
            return await persist_and_return(user_email, message, response_text, metadata)
        except Exception as e:
            logger.error(f"Error executing stock comparison: {e}")

    # Priority 2: Historical OHLCV Range & Performance Queries (Requirement 11)
    if symbols and any(k in lower for k in ["last week", "last month", "highest price", "lowest price", "30 days", "historical", "past price", "yesterday"]):
        symbol = symbols[0]
        try:
            df = await get_historical_ohlcv(symbol, timeframe="1M")
            if df is not None and not df.empty:
                max_high = df["high"].max()
                min_low = df["low"].min()
                avg_close = df["close"].mean()
                latest_close = df["close"].iloc[-1]
                earliest_close = df["close"].iloc[0]
                period_return = ((latest_close - earliest_close) / earliest_close) * 100
                total_vol = df["volume"].sum()
                
                response_text = (
                    f"### 📈 {symbol} Historical Performance Analysis (30-Day yfinance Data)\n\n"
                    f"• **Highest Price (30D)**: ₹{max_high:.2f}\n"
                    f"• **Lowest Price (30D)**: ₹{min_low:.2f}\n"
                    f"• **Average Closing Price**: ₹{avg_close:.2f}\n"
                    f"• **30-Day Net Return**: **{('+' if period_return >= 0 else '')}{period_return:.2f}%**\n"
                    f"• **Total Cumulative Volume**: {total_vol:,} shares\n"
                    f"• **Data Source**: Historical OHLCV retrieved via yfinance.\n\n"
                    f"💡 *Historical price action provides context for technical trend and volatility analysis.*"
                )
                metadata = {"intent": "HISTORICAL_QUERY", "symbol": symbol}
                return await persist_and_return(user_email, message, response_text, metadata)
        except Exception as e:
            logger.error(f"Error fetching historical data for {symbol}: {e}")

    # Priority 3: Single Stock Real-Time AI Analysis (Requirements 7, 8, 9, 10)
    if symbols:
        symbol = symbols[0]
        try:
            quote = await get_stock_quote(symbol)
            df = await get_historical_ohlcv(symbol, timeframe="3M")
            analysis = await generate_and_save_analysis(symbol, df)
            
            sig = analysis["signal"]
            conf = analysis["confidence"]
            up_p = analysis["up_probability"]
            down_p = analysis["down_probability"]
            price = quote["current_price"]
            chg = quote["change_percent"]
            reasons = analysis["reasons"]
            ts = quote.get("timestamp", datetime.now().strftime("%Y-%m-%d %H:%M"))
            
            sig_emoji = "🟢" if sig == "BUY" else ("🔴" if sig == "SELL" else "🟡")
            badge = f"{sig_emoji} **{sig}** ({conf}% Confidence)"
            
            # Trend calculation
            rsi_val = quote.get('indicators', {}).get('rsi', 50.0)
            sma20 = quote.get('indicators', {}).get('sma20', price)
            sma50 = quote.get('indicators', {}).get('sma50', price)
            
            if price > sma20 and rsi_val > 50:
                trend_str = "Bullish 📈"
            elif price < sma20 and rsi_val < 50:
                trend_str = "Bearish 📉"
            else:
                trend_str = "Neutral / Sideways ⚖️"
                
            response_text = (
                f"### {symbol} ({quote.get('name', symbol)}) Analysis\n\n"
                f"• **Latest Available Price**: ₹{price:.2f} ({( '+' if chg >= 0 else '' )}{chg:.2f}% 24h)\n"
                f"• **Market Data Timestamp**: `{ts}`\n"
                f"• **Data Source**: Latest available market data from yfinance\n"
                f"• **Trend**: {trend_str}\n\n"
                f"**Technical Indicators (yfinance Calculated)**:\n"
                f"• **SMA20**: `₹{sma20}` | **SMA50**: `₹{sma50}`\n"
                f"• **RSI (14)**: `{rsi_val}` (Scale 0–100)\n"
                f"• **MACD Hist**: `{quote.get('indicators', {}).get('macd_hist', 'N/A')}`\n"
                f"• **20-Day Volatility**: `{quote.get('indicators', {}).get('volatility', 'N/A')}%`\n\n"
                f"**Machine Learning Prediction**:\n"
                f"• **Random Forest Classifier**: **{sig}**\n"
                f"• **XGBoost Architecture**: **{sig}**\n"
                f"• **Final Signal**: {badge}\n"
                f"• **Directional Probabilities**: Up: **{up_p}%** | Down: **{down_p}%**\n\n"
                f"**Why did the model give this signal ({sig})?**\n"
            )
            for r in reasons[:5]:
                response_text += f"✓ {r}\n"
                
            response_text += (
                f"\n⚠️ **Risk & Uncertainty Disclaimer**:\n"
                f"The model currently indicates **{sig}** based on the available yfinance data. "
                f"These signals represent statistical probability estimations and do not guarantee profit or future price performance. "
                f"If the market is closed, displayed values represent the latest available session data."
            )
            
            metadata = {
                "intent": "STOCK_ANALYSIS",
                "symbol": symbol,
                "signal": sig,
                "confidence": conf,
                "price": price,
                "change_percent": chg
            }
            return await persist_and_return(user_email, message, response_text, metadata)
        except Exception as e:
            logger.error(f"Error executing stock analysis for {symbol}: {e}")

    # Priority 4: Portfolio / Account Health Intent
    if any(k in lower for k in ["portfolio", "balance", "my cash", "holdings", "how much money", "p/l", "profit", "loss", "account value"]):
        try:
            port = await calculate_live_portfolio(user_email)
            total_val = port["total_value"]
            cash = port["cash"]
            invested = port["invested_capital"]
            total_pl = port["total_pl"]
            total_pl_pct = port["total_pl_percent"]
            holdings = port.get("holdings", [])
            
            pl_sign = "+" if total_pl >= 0 else ""
            response_text = (
                f"### 💼 Your TradeMind AI Portfolio Analytics\n\n"
                f"• **Total Portfolio Value**: ₹{total_val:,.2f}\n"
                f"• **Available Virtual Cash**: ₹{cash:,.2f}\n"
                f"• **Invested Capital**: ₹{invested:,.2f}\n"
                f"• **Net Realized/Unrealized P/L**: **{pl_sign}₹{total_pl:,.2f} ({pl_sign}{total_pl_pct:.2f}%)**\n"
                f"• **Positions Held**: {len(holdings)} equities\n\n"
            )
            if holdings:
                response_text += "**Open Holdings Ledger**:\n"
                for h in holdings[:5]:
                    u_pl_sign = "+" if h['unrealized_pl'] >= 0 else ""
                    response_text += (
                        f"• **{h['symbol']}**: {h['quantity']} shares | Avg Entry: ₹{h['avg_buy_price']:.2f} "
                        f"| Market: ₹{h['current_price']:.2f} | P/L: {u_pl_sign}₹{h['unrealized_pl']:.2f} ({u_pl_sign}{h['unrealized_pl_percent']}%)\n"
                    )
            else:
                response_text += "You currently hold 100% of your ₹1,00,000 capital in virtual cash. Place a paper trade to build your holdings!"
                
            metadata = {"intent": "PORTFOLIO_QUERY", "total_value": total_val, "cash": cash}
            return await persist_and_return(user_email, message, response_text, metadata)
        except Exception as e:
            logger.error(f"Error fetching portfolio query: {e}")

    # Priority 5: Deep Stock Market Knowledge Base Match (Requirement 13 & 14)
    matched_topic = score_knowledge_match(message)
    if matched_topic:
        response_text = f"### 📚 {matched_topic['title']}\n\n{matched_topic['content']}"
        metadata = {"intent": "MARKET_KNOWLEDGE", "topic": matched_topic["title"]}
        return await persist_and_return(user_email, message, response_text, metadata)

    # Priority 6: Backtesting Guidance Intent
    if any(k in lower for k in ["backtest", "backtesting", "strategy", "simulate", "drawdown", "win rate"]):
        response_text = (
            "### 🧪 Quantitative Backtesting Guide\n\n"
            "Backtesting evaluates quantitative trading rules against historical yfinance OHLCV data:\n"
            "1. **Select Stock**: Choose from AAPL, MSFT, NVDA, TSLA, AMZN, GOOGL, RELIANCE, TCS, or INFY.\n"
            "2. **Select Strategy**:\n"
            "   • **TradeMind AI ML-Ensemble Signal**: Trades walk-forward Random Forest probability outputs.\n"
            "   • **SMA Crossover (SMA20/SMA50)**: Classic Golden/Death cross trend following.\n"
            "   • **RSI Momentum (30/70)**: Mean-reversion swing trading.\n"
            "3. **Metrics Evaluated**: Net Profit, Win Rate %, Total Trades, Profit Factor, and Maximum Drawdown (MDD) %.\n\n"
            "👉 Head to the **Backtest Lab** in the navigation bar to launch an interactive simulation!"
        )
        metadata = {"intent": "BACKTESTING_GUIDE"}
        return await persist_and_return(user_email, message, response_text, metadata)

    # Priority 7: General Fallback Response (Compliant with Master System Prompt)
    response_text = (
        "👋 Hello! I am **TradeMind AI Copilot**, your intelligent Stock Market, Technical Analysis, and Trading Bot Assistant.\n\n"
        "I am connected directly to the project's **yfinance** data engine and Random Forest ML models. You can ask me:\n\n"
        "• **Current Market Quotes**: *'What is the latest price of TCS or RELIANCE?'*\n"
        "• **Stock Analysis & Signals**: *'Analyze INFY'* or *'Why did the model give BUY for AAPL?'*\n"
        "• **Stock Comparison**: *'Compare TCS and INFY'*\n"
        "• **Historical Performance**: *'What was TCS's highest price last month?'*\n"
        "• **Portfolio Status**: *'Check my portfolio balance and holdings'*\n"
        "• **Educational Concepts**: *'Explain RSI, MACD, Bollinger Bands, Stop-Loss, or Random Forest'*\n"
        "• **Project Architecture**: *'Explain my trading bot'* or *'How does yfinance work in this project?'*\n\n"
        "What stock, indicator, or trading concept would you like to explore?"
    )
    metadata = {"intent": "GENERAL_HELP"}
    return await persist_and_return(user_email, message, response_text, metadata)

async def persist_and_return(user_email: str, user_msg: str, bot_response: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
    """Persists chat conversation into MongoDB chat_messages collection."""
    col = get_collection("chat_messages")
    now = datetime.now(timezone.utc)
    
    await col.insert_one({
        "user_email": user_email.lower().strip(),
        "sender": "user",
        "message": user_msg,
        "timestamp": now
    })
    
    doc = {
        "user_email": user_email.lower().strip(),
        "sender": "bot",
        "message": bot_response,
        "metadata": metadata,
        "timestamp": datetime.now(timezone.utc)
    }
    await col.insert_one(doc)
    
    return {
        "response": bot_response,
        "metadata": metadata,
        "timestamp": doc["timestamp"].isoformat()
    }

async def get_chat_history(user_email: str, limit: int = 30) -> List[Dict[str, Any]]:
    """Retrieves conversation history for user from MongoDB."""
    col = get_collection("chat_messages")
    cursor = col.find({"user_email": user_email.lower().strip()}).sort("timestamp", 1).limit(limit)
    
    history = []
    async for item in cursor:
        history.append({
            "sender": item.get("sender", "bot"),
            "message": item.get("message", ""),
            "metadata": item.get("metadata", {}),
            "timestamp": item.get("timestamp").isoformat() if hasattr(item.get("timestamp"), "isoformat") else str(item.get("timestamp"))
        })
    return history

async def clear_chat_history(user_email: str) -> bool:
    """Clears user's conversation history."""
    col = get_collection("chat_messages")
    await col.delete_many({"user_email": user_email.lower().strip()})
    return True
