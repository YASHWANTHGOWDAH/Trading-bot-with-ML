# TradeMind AI — VS Code Quickstart Guide

Welcome to **TradeMind AI**! This guide explains how to open, run, and develop this project inside **Visual Studio Code**.

---

## 1. Prerequisites Checklist

Before running the project, verify that you have these installed on your Windows machine:
1. **Python 3.10+**: Run `python --version` in terminal.
2. **Node.js 18+ & npm**: Run `node -v` and `npm -v` in terminal.
3. **MongoDB**: Ensure MongoDB Server is running locally on port `27017` (default Windows Service).
4. **Visual Studio Code**: Installed with the recommended Python extension.

---

## 2. Opening the Project in VS Code

1. Extract the `TradeMind-AI.zip` file to any location on your PC.
2. Open **VS Code**.
3. Click **File -> Open Folder...** (or press `Ctrl + K, Ctrl + O`).
4. Select the extracted `TradeMind-AI` folder and click **Select Folder**.

---

## 3. Running the Project (Choose Any Method)

### Method A: One-Click Windows Launcher (Easiest)
In File Explorer or inside the VS Code Explorer:
* Simply double-click **`start-all.bat`**.
* It checks MongoDB, launches the Backend in one terminal window, launches the Frontend in another, and automatically opens [http://localhost:5173](http://localhost:5173) in your default browser.

---

### Method B: VS Code Tasks (Recommended inside VS Code)
We have pre-configured `.vscode/tasks.json` for you:
1. Press `Ctrl + Shift + B` (Default Build Task shortcut).
2. Or go to the top menu: **Terminal -> Run Task... -> "Start Full Stack (TradeMind AI)"**.
3. VS Code will open two dedicated terminal panes side-by-side:
   - Pane 1: `FastAPI Backend` running on `http://127.0.0.1:8000`
   - Pane 2: `Vite React Frontend` running on `http://localhost:5173`
4. Open [http://localhost:5173](http://localhost:5173) in your browser!

---

### Method C: VS Code Integrated Terminals (Manual)

If you prefer full control via VS Code's integrated terminal (`Ctrl + ~`):

#### Terminal 1 — Backend:
```bash
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
> Backend runs at `http://127.0.0.1:8000`  
> Interactive API Docs (Swagger): `http://127.0.0.1:8000/docs`

#### Terminal 2 — Frontend:
Click the `+` button in the terminal panel to open a second terminal:
```bash
cd frontend
npm run dev
```
> Frontend runs at `http://localhost:5173`

---

### Method D: VS Code Debugger (F5)
Press **F5** in VS Code or go to **Run and Debug** (`Ctrl + Shift + D`):
- Select **"Python: TradeMind Backend (FastAPI)"** to set breakpoints and debug Python signal logic.
- Or select **"Launch Chrome against Frontend"** for client-side debugging.

---

## 4. First-Time Setup on a New Machine

If running on a fresh computer without the packages installed:
1. Run `setup.bat` (installs both backend python libraries and frontend npm packages in one click).
2. Or in terminal:
```bash
pip install -r backend/requirements.txt
cd frontend
npm install
```

---

## 5. Testing the Trained Financial Chatbot

1. Open [http://localhost:5173](http://localhost:5173) in your browser.
2. In the bottom-right corner, click the floating **TradeMind Copilot** icon.
3. Try asking:
   - *"What is the signal for AAPL?"* (Pulls live price + runs Random Forest ML model)
   - *"Explain RSI and MACD."*
   - *"What is position sizing and stop loss?"*
   - *"What are Call and Put options?"*
   - *"What is an IPO and dividend yield?"*
   - *"Check my portfolio balance."*

---

## 6. Architecture & Directory Structure

```text
TradeMind-AI/
├── .vscode/                 # VS Code tasks, debugging, and workspace settings
│   ├── launch.json          # Debug configurations (FastAPI + Chrome)
│   ├── tasks.json           # One-shortcut runners (Ctrl+Shift+B)
│   ├── settings.json        # Workspace format & linter settings
│   └── extensions.json      # Recommended VS Code plugins
├── backend/                 # FastAPI REST API & Machine Learning Engine
│   ├── app/
│   │   ├── main.py          # FastAPI application & route registration
│   │   ├── config.py        # Settings (MongoDB URL, JWT secrets, etc.)
│   │   ├── database.py      # Motor async MongoDB connector & indexes
│   │   ├── routes/          # Auth, market, ai, paper, portfolio, chat, etc.
│   │   └── services/        # ML models, signal engine, indicators, chatbot
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile
├── frontend/                # React 19 + Vite Single Page Application
│   ├── src/
│   │   ├── App.jsx          # Router & layout
│   │   ├── components/      # ChatbotWidget, Navbar, AIChartBox, etc.
│   │   ├── pages/           # Dashboard, Markets, AI Analyst, Paper Trading, etc.
│   │   ├── services/api.js  # Axios HTTP client with JWT interceptor
│   │   └── charts/          # Interactive candlestick & equity curve charts
│   ├── package.json         # Node.js dependencies
│   └── vite.config.js       # Vite build configuration
├── database/
│   └── collections.md       # MongoDB schema design (10 collections + chat)
├── docs/
│   └── PROJECT.md           # 23-Chapter Academic Major Project Report
├── start-all.bat            # One-click Windows launcher for both servers
├── start-backend.bat        # Standalone backend launcher
├── start-frontend.bat       # Standalone frontend launcher
├── setup.bat                # Automated dependency installer
└── docker-compose.yml       # Containerized multi-service deployment
```
