@echo off
title TripCraft
color 0A

echo.
echo  ================================================
echo   TripCraft - Trip Planning App
echo  ================================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js is not installed!
    echo  Please download and install it from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules\" (
    echo  Installing dependencies for the first time...
    echo  This may take a minute.
    echo.
    call npm install
    if errorlevel 1 (
        echo  [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
)

REM Create .env from example if it doesn't exist
if not exist ".env" (
    copy ".env.example" ".env" >nul
)

REM Create data directory if it doesn't exist
if not exist "data\" mkdir data

echo  Starting TripCraft...
echo.

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1" ^| head -1') do set LOCAL_IP=%%a
set LOCAL_IP=%LOCAL_IP: =%

echo  -----------------------------------------------
echo   App running at:
echo     Local:   http://localhost:5174
echo     Network: http://%LOCAL_IP%:5174
echo.
echo   Share the Network address with others on
echo   your WiFi to let them access the app!
echo  -----------------------------------------------
echo.
echo  Press Ctrl+C to stop the app.
echo.

REM Start both backend and frontend
start "TripCraft Backend" /min cmd /c "node server.js"
timeout /t 2 /nobreak >nul
npm run dev -- --host
