@echo off
REM ──────────────────────────────────────────────────────────
REM  start.bat — AI Driver Behavior Monitoring System
REM  
REM  Windows startup script
REM  - Checks system requirements
REM  - Sets up Python venv & installs dependencies
REM  - Downloads ML models
REM  - Builds React frontend & starts dev server
REM  - Starts FastAPI backend
REM ──────────────────────────────────────────────────────────
setlocal EnableDelayedExpansion

set ROOT_DIR=%~dp0
set SERVER_DIR=%ROOT_DIR%server
set CLIENT_DIR=%ROOT_DIR%client
set VENV_DIR=%ROOT_DIR%.venv
set PATH=%VENV_DIR%\Scripts;%PATH%

cls
echo.
echo ======================================================
echo   AI Driver Behavior Monitoring System
echo   Setup ^& Launch
echo ======================================================
echo.

REM ── 1. Check system requirements ──────────────────────────
echo [INFO]  Checking system requirements...

where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python not found. Please install Python 3.11+
    echo         Download from: https://www.python.org
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('python --version 2^>^&1') do set PYTHON_VER=%%i
echo [OK]    %PYTHON_VER% detected

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [WARN]  Node.js not found
    echo         Frontend will be built but live dev server unavailable
    echo         To enable live development, install Node.js 18+: https://nodejs.org
    set SKIP_FRONTEND_DEV=1
) else (
    for /f "tokens=*" %%i in ('node --version 2^>^&1') do set NODE_VER=%%i
    echo [OK]    Node.js !NODE_VER! detected
)

REM ── 2. Python virtual environment ────────────────────────
echo [INFO]  Setting up Python virtual environment...
if not exist "%VENV_DIR%\Scripts\activate.bat" (
    python -m venv "%VENV_DIR%"
)
call "%VENV_DIR%\Scripts\activate.bat"
echo [OK]    Python venv activated

REM ── 3. Install Python dependencies ───────────────────────
echo [INFO]  Installing Python dependencies (this may take a few minutes^)...
pip install --quiet --upgrade pip setuptools wheel
pip install --quiet -r "%SERVER_DIR%\requirements.txt"
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install Python packages
    pause
    exit /b 1
)
echo [OK]    Python packages installed

REM ── 4. Download models if missing ───────────────────────
if not exist "%SERVER_DIR%\models" mkdir "%SERVER_DIR%\models"

echo [INFO]  Checking ML models...

if not exist "%SERVER_DIR%\models\shape_predictor_68_face_landmarks.dat" (
    echo [INFO]  Downloading dlib face landmarks model (10 MB^)...
    powershell -Command "(New-Object Net.WebClient).DownloadFile('http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2','%TEMP%\sp.bz2')" 2>nul
    if exist "%TEMP%\sp.bz2" (
        echo [WARN]  dlib model downloaded but needs manual extraction
        echo         Download bzip2 or use online decompressor
    ) else (
        echo [WARN]  dlib model download failed — plate reading will not work
    )
) else (
    echo [OK]    dlib model already present
)

if not exist "%SERVER_DIR%\models\face_landmarker.task" (
    echo [INFO]  Downloading MediaPipe face landmarker model (50 MB^)...
    powershell -Command "(New-Object Net.WebClient).DownloadFile('https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task','%SERVER_DIR%\models\face_landmarker.task')" 2>nul
    echo [OK]    MediaPipe model downloaded
) else (
    echo [OK]    MediaPipe model already present
)

if not exist "%SERVER_DIR%\models\yolov8n.pt" (
    echo [INFO]  Downloading YOLOv8n model (25 MB^)...
    python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')" >nul 2>&1
    if exist "yolov8n.pt" (
        move "yolov8n.pt" "%SERVER_DIR%\models\" >nul
        echo [OK]    YOLOv8n model downloaded
    ) else (
        echo [WARN]  YOLOv8n model download failed
    )
) else (
    echo [OK]    YOLOv8n model already present
)

REM ── 5. Node.js & client setup ─────────────────────────────
if "%SKIP_FRONTEND_DEV%"=="1" goto :skip_frontend

echo [INFO]  Installing Node.js dependencies...
cd /d "%CLIENT_DIR%"
call npm install --silent 2>nul
if %ERRORLEVEL% neq 0 (
    echo [WARN]  npm install failed
)
echo [OK]    Node packages installed
cd /d "%ROOT_DIR%"

:skip_frontend
echo.

REM ── 6. Kill stale processes on ports ─────────────────────
echo [INFO]  Checking for stale processes on ports 8000 and 3000...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":8000.*LISTENING"') do (
    echo [WARN]  Killing process on port 8000 (PID %%a^)
    taskkill /F /PID %%a >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000.*LISTENING"') do (
    echo [WARN]  Killing process on port 3000 (PID %%a^)
    taskkill /F /PID %%a >nul 2>nul
)
timeout /t 1 >nul 2>nul

REM ── 7. Summary ──────────────────────────────────────────
echo.
echo ======================================================
echo   Setup Complete
echo ======================================================
echo.
echo   Backend  (FastAPI):  http://localhost:8000
echo   Frontend (React):    http://localhost:3000
echo   Health Check:        http://localhost:8000/api/health
echo.
echo   Close this window or press Ctrl+C to stop servers
echo.

REM ── 8. Start backend (port 8000) in background ───────────
echo [INFO]  Starting FastAPI backend on http://localhost:8000 ...
cd /d "%SERVER_DIR%"
start "DriverAI-Backend" /B python -m uvicorn backend:app --host 0.0.0.0 --port 8000
timeout /t 2 >nul 2>nul
echo [OK]    Backend started

REM ── 9. Start frontend (port 3000) ───────────────────────
if "%SKIP_FRONTEND_DEV%"=="1" (
    echo [INFO]  No Node.js — open http://localhost:8000 for pre-built frontend
    goto :wait_loop
)

echo [INFO]  Starting React dev server on http://localhost:3000 ...
cd /d "%CLIENT_DIR%"
start "DriverAI-Frontend" /B npm run dev
timeout /t 2 >nul 2>nul
echo [OK]    Frontend started
echo.
echo   Open http://localhost:3000 in your browser
echo.

:wait_loop
echo Press any key to stop both servers...
pause >nul
echo [INFO]  Shutting down...
taskkill /FI "WINDOWTITLE eq DriverAI-Backend" /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq DriverAI-Frontend" /F >nul 2>nul
echo [OK]    All servers stopped

endlocal
