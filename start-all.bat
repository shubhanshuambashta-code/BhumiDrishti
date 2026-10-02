@echo off
title BhumiDrishti - SIH 2026 Master Launcher
echo =====================================================================
echo           BhumiDrishti - GIS Land Acquisition Risk Intelligence
echo                        Smart India Hackathon 2026
echo =====================================================================
echo.
echo Launching all services simultaneously:
echo   [1] Python FastAPI ML Service    (Port 8001)
echo   [2] Node.js Express Backend API  (Port 3001)
echo   [3] React Leaflet GIS Frontend   (Port 3000)
echo.

set ROOT_DIR=%~dp0
cd /d "%ROOT_DIR%"

:: Locate Node.js
where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    set NODE_CMD=node
) else (
    if exist "C:\Users\shubhanshu ambshta\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
        set "NODE_CMD=C:\Users\shubhanshu ambshta\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
    ) else (
        echo [ERROR] Node.js not found. Please install Node.js (v18+).
        pause
        exit /b 1
    )
)

:: 1. Start Python FastAPI ML Service
echo [1/3] Starting Python ML Service on http://localhost:8001 ...
start "BhumiDrishti - [1] ML Service (:8001)" cmd /k "cd /d "%ROOT_DIR%" && python -m uvicorn ml.prediction.app:app --host 0.0.0.0 --port 8001 --reload"

timeout /t 2 /nobreak >nul

:: 2. Start Node.js Express Backend API
echo [2/3] Starting Backend API on http://localhost:3001 ...
start "BhumiDrishti - [2] Backend API (:3001)" cmd /k "cd /d "%ROOT_DIR%backend" && "%NODE_CMD%" src/server.js"

timeout /t 2 /nobreak >nul

:: 3. Start React Frontend Dashboard
echo [3/3] Starting React GIS Frontend on http://localhost:3000 ...
start "BhumiDrishti - [3] React Frontend (:3000)" cmd /k "cd /d "%ROOT_DIR%frontend" && "%NODE_CMD%" "node_modules/react-scripts/bin/react-scripts.js" start"

echo.
echo =====================================================================
echo All 3 services launched in dedicated terminal windows!
echo Opening dashboard in browser: http://localhost:3000
echo =====================================================================
timeout /t 5 /nobreak >nul
start http://localhost:3000
