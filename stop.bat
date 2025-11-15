@echo off
echo.
echo Stopping Homestead Project...
echo.

REM Get the directory where the script is located
set SCRIPT_DIR=%~dp0
cd /d %SCRIPT_DIR%

REM Stop Frontend
echo Stopping Frontend...
taskkill /FI "WindowTitle eq Homestead Frontend*" /T /F >nul 2>&1
if %errorlevel% equ 0 (
    echo    Frontend stopped
) else (
    echo    Frontend process not found or already stopped
)
echo.

REM Stop Backend
echo Stopping Backend...
taskkill /FI "WindowTitle eq Homestead Backend*" /T /F >nul 2>&1
if %errorlevel% equ 0 (
    echo    Backend stopped
) else (
    echo    Backend process not found or already stopped
)
echo.

REM Stop MongoDB
echo Stopping MongoDB...
cd mongo
if exist stop.bat (
    call stop.bat
) else (
    echo WARNING: mongo/stop.bat not found. Stopping with docker-compose...
    docker-compose down
)
cd ..
echo.

echo ========================================
echo All services stopped!
echo ========================================
echo.
echo Note: Log files are preserved in the logs\ directory
echo.
pause
