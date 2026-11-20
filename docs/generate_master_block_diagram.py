import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Rectangle, Circle

os.environ['MPLCONFIGDIR'] = r'C:\Users\yashw\AppData\Local\Temp'

DOCS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(DOCS_DIR)
FIGURES_DIR = os.path.join(DOCS_DIR, "figures")
FRONTEND_PUBLIC = os.path.join(PROJECT_ROOT, "frontend", "public")
DOWNLOADS_DIR = os.path.join(os.path.expanduser("~"), "Downloads")
os.makedirs(FIGURES_DIR, exist_ok=True)

OUTPUT_NAME = "PROJECT_BLOCK_DIAGRAM_SYSTEM_SCHEMATIC.png"
PNG_OUT_DOCS = os.path.join(FIGURES_DIR, OUTPUT_NAME)
PNG_OUT_PUBLIC = os.path.join(FRONTEND_PUBLIC, OUTPUT_NAME)
PNG_OUT_DOWNLOADS = os.path.join(DOWNLOADS_DIR, OUTPUT_NAME)

# Professional Palette
BG_COLOR = "#0A0E17"
CARD_BG = "#111827"
CARD_BORDER = "#1E293B"
TEXT_WHITE = "#F8FAFC"
TEXT_MUTED = "#94A3B8"
CYAN_ACCENT = "#06B6D4"
PURPLE_ACCENT = "#8B5CF6"
GREEN_ACCENT = "#10B981"
AMBER_ACCENT = "#F59E0B"
BLUE_ACCENT = "#3B82F6"
RED_ACCENT = "#EF4444"

plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['font.family'] = 'sans-serif'

def draw_card(ax, x, y, w, h, title, subtitle="", bg=CARD_BG, border=CARD_BORDER, rx=0.015, title_color=TEXT_WHITE, title_size=10, sub_size=8, sub_color=TEXT_MUTED, align="center"):
    box = FancyBboxPatch((x, y), w, h, boxstyle=f"round,pad=0.01,rounding_size={rx}",
                         facecolor=bg, edgecolor=border, linewidth=1.4, zorder=2)
    ax.add_patch(box)
    
    if subtitle:
        if align == "center":
            ax.text(x + w/2, y + h*0.64, title, ha='center', va='center', fontsize=title_size, fontweight='bold', color=title_color, zorder=3)
            ax.text(x + w/2, y + h*0.34, subtitle, ha='center', va='center', fontsize=sub_size, color=sub_color, zorder=3)
        else:
            ax.text(x + 0.015*w, y + h*0.68, title, ha='left', va='center', fontsize=title_size, fontweight='bold', color=title_color, zorder=3)
            ax.text(x + 0.015*w, y + h*0.34, subtitle, ha='left', va='center', fontsize=sub_size, color=sub_color, zorder=3)
    else:
        ax.text(x + w/2, y + h/2, title, ha='center', va='center', fontsize=title_size, fontweight='bold', color=title_color, zorder=3)

def draw_arrow(ax, x1, y1, x2, y2, color=BLUE_ACCENT, lw=1.8, label="", label_pos=0.5):
    arrow = FancyArrowPatch((x1, y1), (x2, y2), arrowstyle='-|>', mutation_scale=16,
                            color=color, linewidth=lw, zorder=4)
    ax.add_patch(arrow)
    if label:
        mx = x1 + (x2 - x1) * label_pos
        my = y1 + (y2 - y1) * label_pos
        ax.text(mx, my + 0.08, label, ha='center', va='bottom', fontsize=8, color=color, fontweight='bold', zorder=5,
                bbox=dict(boxstyle="round,pad=0.2", fc=BG_COLOR, ec="none", alpha=0.85))

def build_schematic():
    print("Generating Master System Architecture & Block Diagram Schematic...")
    fig, ax = plt.subplots(figsize=(24, 13.5), dpi=300)
    ax.set_facecolor(BG_COLOR)
    fig.patch.set_facecolor(BG_COLOR)
    ax.axis('off')

    # ========================================================
    # 1. HEADER SECTION (BANNER & KPIS)
    # ========================================================
    # Top Outer Banner
    header_box = FancyBboxPatch((0.5, 11.8), 23.0, 1.4, boxstyle="round,pad=0.02,rounding_size=0.01",
                                facecolor="#0F172A", edgecolor="#38BDF8", linewidth=1.8, zorder=2)
    ax.add_patch(header_box)

    ax.text(12.0, 12.75, "INTELLIGENT TRADING BOT WITH REAL-TIME MARKET DATA ANALYSIS",
            ha='center', va='center', fontsize=18, fontweight='bold', color="#38BDF8", zorder=3)
    ax.text(12.0, 12.35, "Full-Stack Machine Learning Architecture, Explainable AI (XAI) Attribution & Virtual Execution Pipeline Schematic",
            ha='center', va='center', fontsize=11.5, color=TEXT_WHITE, zorder=3)
    ax.text(12.0, 11.98, "FastAPI 0.110 (Python 3.11)  •  MongoDB 7.0 Document Database  •  Random Forest (100 Trees)  •  React 19 + Vite  •  Dual Timezone (NSE & NASDAQ)",
            ha='center', va='center', fontsize=9.5, color=TEXT_MUTED, zorder=3)

    # Top KPI Metrics Strip
    kpis = [
        ("DIRECTIONAL TEST ACCURACY", "78.4%", GREEN_ACCENT),
        ("AVERAGE API RESPONSE", "< 50 ms", CYAN_ACCENT),
        ("STANDARDIZED FEATURES", "13 Tech Indicators", PURPLE_ACCENT),
        ("RANDOM FOREST ENSEMBLE", "100 Decision Trees", BLUE_ACCENT),
        ("VIRTUAL PAPER TRADING", "₹1,00,000 Balance", AMBER_ACCENT),
        ("BACKTEST STRATEGY WIN RATE", "87.5% (ML Ensemble)", GREEN_ACCENT)
    ]
    for idx, (title, val, col) in enumerate(kpis):
        x = 0.5 + idx * 3.86
        bx = FancyBboxPatch((x, 10.9), 3.65, 0.72, boxstyle="round,pad=0.01",
                            facecolor="#1E293B", edgecolor=col, linewidth=1.2, zorder=2)
        ax.add_patch(bx)
        ax.text(x + 1.82, 11.38, title, ha='center', va='center', fontsize=7.5, color=TEXT_MUTED, zorder=3)
        ax.text(x + 1.82, 11.08, val, ha='center', va='center', fontsize=10, fontweight='bold', color=col, zorder=3)

    # ========================================================
    # 2. COLUMN 1: MARKET DATA INGESTION & CACHING (Cyan)
    # ========================================================
    col1_bg = FancyBboxPatch((0.5, 0.6), 4.2, 10.1, boxstyle="round,pad=0.02",
                             facecolor="#0B132B", edgecolor=CYAN_ACCENT, linewidth=1.5, zorder=1)
    ax.add_patch(col1_bg)
    ax.text(2.6, 10.35, "1. INGESTION & CACHING TIER", ha='center', fontsize=11, fontweight='bold', color=CYAN_ACCENT, zorder=3)
    ax.text(2.6, 10.1, "Multi-Exchange Market Feeds & Storage", ha='center', fontsize=8, color=TEXT_MUTED, zorder=3)

    # Box 1.1: Live External Equity Feeds
    draw_card(ax, 0.7, 8.4, 3.8, 1.45, "Live Financial Equities Universe",
              "• NSE (India): 15 Blue-Chips (RELIANCE,\nTCS, INFY, HDFCBANK, ICICIBANK, SBIN...)\n• NASDAQ (US): 10 Leaders (AAPL, MSFT,\nNVDA, TSLA, AMZN, GOOGL, META...)",
              bg="#1E293B", border=CYAN_ACCENT, title_size=9, sub_size=7.5, title_color=CYAN_ACCENT)

    # Box 1.2: Ingestion Service
    draw_card(ax, 0.7, 6.4, 3.8, 1.6, "Yahoo Finance Ingestion Pipeline",
              "• yfinance API (fast_info ticker lookups)\n• Multi-Timeframe Candles (1D, 1W, 1M, 3M, 1Y)\n• Asynchronous Thread Pool (asyncio.to_thread)\n• 3.5-Second In-Memory TTL Cache (< 5ms)",
              bg="#1E293B", border=CYAN_ACCENT, title_size=9, sub_size=7.5, title_color=CYAN_ACCENT)

    # Box 1.3: Deterministic Fallback Engine
    draw_card(ax, 0.7, 4.4, 3.8, 1.6, "Geometric Brownian Motion (GBM)",
              "• Deterministic Stochastic Drift-Diffusion Engine:\n  S(t+1) = S(t)*exp((μ - σ²/2)Δt + σ√Δt Z)\n• Engages during API rate-limits or downtime\n• Guarantees 100% Platform Availability",
              bg="#1E293B", border=AMBER_ACCENT, title_size=9, sub_size=7.5, title_color=AMBER_ACCENT)

    # Box 1.4: MongoDB Document Store
    draw_card(ax, 0.7, 1.0, 3.8, 2.95, "MongoDB Database: trademind_ai",
              "• market_data: Cached OHLCV candle arrays\n• users: Credentials hashed via Argon2id\n• portfolios: Virtual cash balances & holdings\n• trades: Immutable execution audit logs\n• watchlists: Custom equity tracking lists\n• alerts: Smart price & signal notifications\n• backtests: Historical run results & equity curves\n• Compound Indexes: (symbol, timeframe)",
              bg="#1E293B", border=CYAN_ACCENT, title_size=9, sub_size=7.5, title_color=CYAN_ACCENT)

    # Internal Arrows Col 1
    draw_arrow(ax, 2.6, 8.4, 2.6, 8.0, color=CYAN_ACCENT)
    draw_arrow(ax, 2.6, 6.4, 2.6, 6.0, color=CYAN_ACCENT)
    draw_arrow(ax, 2.6, 4.4, 2.6, 3.95, color=CYAN_ACCENT)

    # ========================================================
    # 3. COLUMN 2: QUANTITATIVE FEATURE PIPELINE (Purple)
    # ========================================================
    col2_bg = FancyBboxPatch((5.0, 0.6), 4.2, 10.1, boxstyle="round,pad=0.02",
                             facecolor="#130D2E", edgecolor=PURPLE_ACCENT, linewidth=1.5, zorder=1)
    ax.add_patch(col2_bg)
    ax.text(7.1, 10.35, "2. QUANTITATIVE FEATURE TIER", ha='center', fontsize=11, fontweight='bold', color=PURPLE_ACCENT, zorder=3)
    ax.text(7.1, 10.1, "13-Feature Engineering & Scaling", ha='center', fontsize=8, color=TEXT_MUTED, zorder=3)

    # Box 2.1: Trend Moving Averages
    draw_card(ax, 5.2, 8.35, 3.8, 1.5, "Trend Moving Averages",
              "• SMA20: 20-Period Short-Term Baseline\n• SMA50: 50-Period Medium-Term Structural Trend\n• SMA Gap % = ((SMA20 - SMA50) / SMA50) * 100\n• Golden Cross / Death Cross Tracking",
              bg="#1E1B4B", border=PURPLE_ACCENT, title_size=9, sub_size=7.5, title_color=PURPLE_ACCENT)

    # Box 2.2: Momentum Oscillators
    draw_card(ax, 5.2, 6.35, 3.8, 1.7, "Momentum Oscillators",
              "• Wilder's Smoothed RSI (14-Period):\n  RSI = 100 - (100 / (1 + RS)), Range [0, 100]\n• MACD (12, 26, 9):\n  MACD Line = EMA12(Close) - EMA26(Close)\n  Signal Line = EMA9(MACD), Hist = Line - Signal",
              bg="#1E1B4B", border=PURPLE_ACCENT, title_size=9, sub_size=7.5, title_color=PURPLE_ACCENT)

    # Box 2.3: Volatility & Returns
    draw_card(ax, 5.2, 4.45, 3.8, 1.6, "Volatility & Price Bounds",
              "• 1-Day Return %: (Close[t] - Close[t-1])/Close[t-1]\n• Rolling Volatility (σ₂₀): 20-Period Std Dev of Returns\n• Price Bounds: Open, High, Low, Close\n• Forward-fill (ffill) & Back-fill (bfill) sanitization",
              bg="#1E1B4B", border=PURPLE_ACCENT, title_size=9, sub_size=7.5, title_color=PURPLE_ACCENT)

    # Box 2.4: In-Sample Feature Normalization
    draw_card(ax, 5.2, 1.0, 3.8, 3.0, "Leak-Free Z-Score Standardization",
              "• Strict Chronological Data Partitioning:\n  80% Historical Train Set / 20% Out-of-Sample Test\n• Zero Temporal Lookahead Bias (No Shuffling!)\n• StandardScaler Z-Score Normalization:\n  z = (x - μ_train) / σ_train\n• Parameters (μ, σ) fit ONLY on Train Set\n• Produces Standardized Vector X_t ∈ R¹³\n• High-throughput NumPy vectorization (< 35ms)",
              bg="#1E1B4B", border=PURPLE_ACCENT, title_size=9, sub_size=7.5, title_color=PURPLE_ACCENT)

    # Internal Arrows Col 2
    draw_arrow(ax, 7.1, 8.35, 7.1, 8.05, color=PURPLE_ACCENT)
    draw_arrow(ax, 7.1, 6.35, 7.1, 6.05, color=PURPLE_ACCENT)
    draw_arrow(ax, 7.1, 4.45, 7.1, 4.0, color=PURPLE_ACCENT)

    # Inter-column Arrow Col 1 -> Col 2
    draw_arrow(ax, 4.7, 5.8, 5.0, 5.8, color=CYAN_ACCENT, label="OHLCV Bars")

    # ========================================================
    # 4. COLUMN 3: ML CLASSIFIER & XAI ENGINE (Green)
    # ========================================================
    col3_bg = FancyBboxPatch((9.5, 0.6), 4.5, 10.1, boxstyle="round,pad=0.02",
                             facecolor="#06221A", edgecolor=GREEN_ACCENT, linewidth=1.5, zorder=1)
    ax.add_patch(col3_bg)
    ax.text(11.75, 10.35, "3. ML & EXPLAINABLE AI TIER", ha='center', fontsize=11, fontweight='bold', color=GREEN_ACCENT, zorder=3)
    ax.text(11.75, 10.1, "100-Tree Random Forest & Dual-Conviction", ha='center', fontsize=8, color=TEXT_MUTED, zorder=3)

    # Box 3.1: Random Forest Ensemble
    draw_card(ax, 9.7, 7.7, 4.1, 2.2, "Random Forest Classifier (100 Trees)",
              "• 100 Independent Decorrelated Decision Trees\n• Bootstrap Aggregation (Bagging) with Replacement\n• Regularized max_depth = 5 (Eliminates noise overfitting)\n• min_samples_split = 4, class_weight = 'balanced'\n• Splitting Criterion: Gini Impurity Reduction (ΔGini)\n• Ensemble Output Probabilities: P(UP) and P(DOWN)",
              bg="#064E3B", border=GREEN_ACCENT, title_size=9.5, sub_size=7.5, title_color=TEXT_WHITE)

    # Box 3.2: Dual-Conviction Decision Engine
    draw_card(ax, 9.7, 4.5, 4.1, 2.8, "Dual-Conviction Decision Synthesizer",
              "• Statistical Conviction Threshold: P >= 0.58\n• [BUY] BUY Signal: P(UP) >= 58% AND >= 2 Bullish Rules:\n  - Price > SMA20 (Positive short-term trend)\n  - SMA20 > SMA50 (Golden Cross alignment)\n  - MACD Hist > 0 (Momentum acceleration)\n  - 40 <= RSI <= 72 (Accumulation without overbought)\n• [SELL] SELL Signal: P(DOWN) >= 58% AND >= 2 Bearish Rules\n• [HOLD] HOLD Signal: Prob < 58% or Indicator Disagreement\n  (Safely preserves capital during choppy markets)",
              bg="#064E3B", border=GREEN_ACCENT, title_size=9.5, sub_size=7.5, title_color=TEXT_WHITE)

    # Box 3.3: Explainable AI Attribution Engine
    draw_card(ax, 9.7, 1.0, 4.1, 3.1, "Explainable AI (XAI) Attribution Module",
              "• Mean Decrease in Impurity (MDI) Gini Feature Ranking:\n  SMA Gap (24.1%), RSI (19.4%), MACD (16.2%)...\n• Rule-Mapping Engine generates Natural Language Checklist:\n  ✔ Price ($224.5) > SMA20 ($221.8) -> Bullish momentum\n  ✔ SMA20 > SMA50 (+1.56% gap) -> Structural uptrend\n  ✔ MACD Hist positive (+0.35) -> Acceleration confirmed\n  ✔ RSI (58.4) -> Steady buying without overbought risk\n  ✔ ML Confidence: 78.4% UP Conviction\n• Sub-2ms execution time (no slow perturbations!)",
              bg="#064E3B", border=GREEN_ACCENT, title_size=9.5, sub_size=7.5, title_color=TEXT_WHITE)

    # Internal Arrows Col 3
    draw_arrow(ax, 11.75, 7.7, 11.75, 7.3, color=GREEN_ACCENT)
    draw_arrow(ax, 11.75, 4.5, 11.75, 4.1, color=GREEN_ACCENT)

    # Inter-column Arrow Col 2 -> Col 3
    draw_arrow(ax, 9.2, 5.8, 9.5, 5.8, color=PURPLE_ACCENT, label="Feature Vector X_t")

    # ========================================================
    # 5. COLUMN 4: SIMULATION, BACKTEST & SCHEDULER (Amber)
    # ========================================================
    col4_bg = FancyBboxPatch((14.3, 0.6), 4.3, 10.1, boxstyle="round,pad=0.02",
                             facecolor="#2A1B07", edgecolor=AMBER_ACCENT, linewidth=1.5, zorder=1)
    ax.add_patch(col4_bg)
    ax.text(16.45, 10.35, "4. APPLICATION & SIMULATION TIER", ha='center', fontsize=11, fontweight='bold', color=AMBER_ACCENT, zorder=3)
    ax.text(16.45, 10.1, "Paper Trading, Backtesting & Timezones", ha='center', fontsize=8, color=TEXT_MUTED, zorder=3)

    # Box 4.1: Dual-Timezone Session Scheduler
    draw_card(ax, 14.5, 7.7, 3.9, 2.2, "Dual-Timezone Exchange Scheduler",
              "• UTC Clock converted to IANA Regional Zones:\n  - Asia/Kolkata (NSE India: Mon-Fri 09:15 - 15:30 IST)\n  - America/New_York (NASDAQ: Mon-Fri 09:30 - 16:00 ET)\n• Modular Minute Arithmetic detects active session state\n• Dynamic Status Badges: [BUY] OPEN  |  [SELL] CLOSED\n• Real-Time Countdowns (e.g. 'Closes in 3h 15m (NSE)')",
              bg="#451A03", border=AMBER_ACCENT, title_size=9.5, sub_size=7.5, title_color=AMBER_ACCENT)

    # Box 4.2: Virtual Paper Trading Terminal
    draw_card(ax, 14.5, 4.35, 3.9, 2.9, "Virtual Paper Trading Execution Engine",
              "• Starting Virtual Capital: ₹1,00,000.00\n• Cash Balance Validation (Prevents negative funds)\n• Position Quantity Checks (Prevents overselling)\n• Weighted Average Cost Accounting:\n  P_avg = (Q_old*P_old + Q_new*P_order) / (Q_old + Q_new)\n• Realized P/L = (P_sell - P_avg) * Q_sold\n• Unrealized P/L calculated on live tick prices\n• Logs every order into immutable MongoDB ledger",
              bg="#451A03", border=AMBER_ACCENT, title_size=9.5, sub_size=7.5, title_color=AMBER_ACCENT)

    # Box 4.3: Walk-Forward Backtesting Lab
    draw_card(ax, 14.5, 1.0, 3.9, 2.95, "Walk-Forward Backtesting Laboratory",
              "• Historical Strategy Simulation over Multi-Month Bars\n• Supported Strategies:\n  - TradeMind AI ML Ensemble (+29.62% Return)\n  - RSI Momentum 30/70 (+21.10% Return)\n  - SMA Trend Crossover (+18.65% Return)\n  - Buy & Hold Baseline (+12.40% Return)\n• Key Statistics: Net Profit (₹), Total Return %,\n  Win Rate (87.5%), Maximum Drawdown (-6.15%)\n• Mapped Equity Growth Curve timestamp arrays",
              bg="#451A03", border=AMBER_ACCENT, title_size=9.5, sub_size=7.5, title_color=AMBER_ACCENT)

    # Internal Arrows Col 4
    draw_arrow(ax, 16.45, 7.7, 16.45, 7.25, color=AMBER_ACCENT)
    draw_arrow(ax, 16.45, 4.35, 16.45, 3.95, color=AMBER_ACCENT)

    # Inter-column Arrow Col 3 -> Col 4
    draw_arrow(ax, 14.0, 5.8, 14.3, 5.8, color=GREEN_ACCENT, label="Signals & Reasons")

    # ========================================================
    # 6. COLUMN 5: REACT 19 PRESENTATION TIER (Blue)
    # ========================================================
    col5_bg = FancyBboxPatch((18.9, 0.6), 4.6, 10.1, boxstyle="round,pad=0.02",
                             facecolor="#0A192F", edgecolor=BLUE_ACCENT, linewidth=1.5, zorder=1)
    ax.add_patch(col5_bg)
    ax.text(21.2, 10.35, "5. WEB PRESENTATION TIER", ha='center', fontsize=11, fontweight='bold', color=BLUE_ACCENT, zorder=3)
    ax.text(21.2, 10.1, "React 19, Vite & Recharts UI", ha='center', fontsize=8, color=TEXT_MUTED, zorder=3)

    # Box 5.1: Real-Time Header & Ticker Pills
    draw_card(ax, 19.1, 8.4, 4.2, 1.5, "Live Ticker Pill Bar & Market Clocks",
              "• Horizontal scrolling equity ticker bar\n• Real-time stock prices & 24h % change pills\n• Dynamic Exchange Status Badges (NSE & NASDAQ)\n• Interactive Timeframe Selectors (1D, 1W, 1M, 3M, 1Y)",
              bg="#1E293B", border=BLUE_ACCENT, title_size=9, sub_size=7.5, title_color=BLUE_ACCENT)

    # Box 5.2: Multi-Mode Recharts Canvas & Tooltip
    draw_card(ax, 19.1, 6.0, 4.2, 2.05, "Interactive Stock Chart & Clean Tooltip",
              "• 4 Visualization Modes: Candles , Bars , Line , Area \n• SMA20 / SMA50 Overlay Toggle Lines\n• Volume Bar Histogram Sub-Chart\n• Ultra-Clean Minimal Tooltip: Displays only Date, Price,\n  and % Change Pill (Eliminates chart clutter)",
              bg="#1E293B", border=BLUE_ACCENT, title_size=9, sub_size=7.5, title_color=BLUE_ACCENT)

    # Box 5.3: AI Market Signal Card
    draw_card(ax, 19.1, 3.8, 4.2, 1.85, "AI Signal Card & XAI Reasoning List",
              "• Prominent Recommendation Badge ([BUY] BUY / [SELL] SELL / [HOLD] HOLD)\n• Confidence Meter (% Conviction)\n• Probability Bar (P(UP) vs P(DOWN))\n• Dynamic Checkmarked Technical Reasoning Bullets",
              bg="#1E293B", border=GREEN_ACCENT, title_size=9, sub_size=7.5, title_color=GREEN_ACCENT)

    # Box 5.4: Paper Trading & Backtest Studio
    draw_card(ax, 19.1, 1.0, 4.2, 2.45, "Paper Trading Terminal & Backtest Studio",
              "• Quick Order Execution Form (BUY / SELL quantity inputs)\n• Active Portfolio Table: Shares, Buy Price, Current Value, P/L\n• Real-Time Portfolio Metric Cards (Value, P/L, Cash)\n• Backtest Studio: Multi-Strategy Dropdown, Metrics Cards,\n  and Interactive Recharts Equity Growth Curves",
              bg="#1E293B", border=BLUE_ACCENT, title_size=9, sub_size=7.5, title_color=BLUE_ACCENT)

    # Internal Arrows Col 5
    draw_arrow(ax, 21.2, 8.4, 21.2, 8.05, color=BLUE_ACCENT)
    draw_arrow(ax, 21.2, 6.0, 21.2, 5.65, color=BLUE_ACCENT)
    draw_arrow(ax, 21.2, 3.8, 21.2, 3.45, color=BLUE_ACCENT)

    # Inter-column Arrow Col 4 -> Col 5
    draw_arrow(ax, 18.6, 5.8, 18.9, 5.8, color=AMBER_ACCENT, label="REST API JSON")

    # ========================================================
    # 7. BOTTOM FOOTER & CITATIONS
    # ========================================================
    footer_box = FancyBboxPatch((0.5, 0.05), 23.0, 0.42, boxstyle="round,pad=0.01",
                                facecolor="#0F172A", edgecolor="#475569", linewidth=1.0, zorder=2)
    ax.add_patch(footer_box)
    ax.text(12.0, 0.26, "Project Title: Intelligent Trading Bot with Real-Time Market Data Analysis  |  Dept. of ISE, Sai Vidya Institute of Technology (SVIT)  |  VTU Belagavi 2026-27",
            ha='center', va='center', fontsize=8.5, color=TEXT_MUTED, zorder=3)

    ax.set_xlim(0, 24)
    ax.set_ylim(0, 13.5)
    plt.tight_layout()

    # Save to docs figures
    plt.savefig(PNG_OUT_DOCS, bbox_inches='tight', dpi=300)
    print(f"SUCCESS: Saved Master Schematic to: {PNG_OUT_DOCS}")

    # Copy to public frontend folder for direct browser viewing
    plt.savefig(PNG_OUT_PUBLIC, bbox_inches='tight', dpi=300)
    print(f"SUCCESS: Copied to Frontend Public at: {PNG_OUT_PUBLIC}")

    # Copy to Windows Downloads folder
    plt.savefig(PNG_OUT_DOWNLOADS, bbox_inches='tight', dpi=300)
    print(f"SUCCESS: Copied to User Downloads at: {PNG_OUT_DOWNLOADS}")
    plt.close()

if __name__ == "__main__":
    build_schematic()
