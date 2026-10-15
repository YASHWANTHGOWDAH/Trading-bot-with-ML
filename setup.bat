@echo off
title TradeMind AI - Setup & Installation
echo ========================================================
echo        TradeMind AI - Setup & Dependency Installer
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Installing Backend Python Requirements...
pip install -r backend\requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Python requirements installation failed. Please check your Python installation.
    pause
    exit /b 1
)

echo.
echo [2/2] Installing Frontend Node.js Dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed. Please check your Node.js installation.
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================================
echo   [SUCCESS] All dependencies installed successfully!
echo   You can now run 'start-all.bat' to launch the app!
echo ========================================================
echo.
pause
