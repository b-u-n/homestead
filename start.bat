@echo off
echo.
echo Starting Homestead Project...
echo.

REM Get the directory where the script is located
set SCRIPT_DIR=%~dp0
cd /d %SCRIPT_DIR%

REM Create logs directory
if not exist logs mkdir logs

REM Start MongoDB
echo Starting MongoDB...
cd mongo
if exist start.bat (
    call start.bat
) else (
    echo WARNING: mongo/start.bat not found. Starting with docker-compose...
    docker-compose up -d
    timeout /t 10 /nobreak >nul
)
cd ..
echo.

REM Wait for MongoDB to be ready
timeout /t 2 /nobreak >nul

REM Start Backend
echo Starting Backend...
cd backend
start "Homestead Backend" /min cmd /c "npm start > ..\logs\backend.log 2>&1"
cd ..
echo    Backend started in background
echo    Logs: logs\backend.log
echo.

REM Wait for backend to start
timeout /t 2 /nobreak >nul

REM Start Frontend
echo Starting Frontend...
cd frontend
start "Homestead Frontend" /min cmd /c "npm start > ..\logs\frontend.log 2>&1"
cd ..
echo    Frontend started in background
echo    Logs: logs\frontend.log
echo.

echo ========================================
echo All services started!
echo ========================================
echo.
echo Service Status:
echo ----------------------------------------
echo    MongoDB:       http://localhost:27017
echo    Mongo Express: http://localhost:8081
echo    Backend API:   http://localhost:3000 (check logs for actual port)
echo    Frontend:      http://0.0.0.0:9001
echo.
echo Logs:
echo    Backend:  type logs\backend.log
echo    Frontend: type logs\frontend.log
echo    MongoDB:  cd mongo ^&^& docker-compose logs -f
echo.
echo To stop all services: stop.bat
echo ========================================
echo.
pause
