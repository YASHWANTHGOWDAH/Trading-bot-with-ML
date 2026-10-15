@echo off
title TradeMind AI - Launcher
echo ========================================================
echo        TradeMind AI - Full Stack Launcher
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking MongoDB...
sc query MongoDB | find "RUNNING" >nul
if %errorlevel% neq 0 (
    echo [WARNING] MongoDB service does not appear to be running!
    echo Attempting to start MongoDB service...
    net start MongoDB
) else (
    echo [OK] MongoDB is running.
)
echo.

echo [2/3] Launching FastAPI Backend on http://127.0.0.1:8000 ...
start "TradeMind AI - Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

echo [3/3] Launching Vite React Frontend on http://localhost:5173 ...
start "TradeMind AI - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo   TradeMind AI servers are booting up!
echo   Frontend : http://localhost:5173
echo   Backend  : http://127.0.0.1:8000/docs
echo ========================================================
echo.
timeout /t 3 >nul
start http://localhost:5173
exit
