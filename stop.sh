#!/bin/bash

echo "🛑 Stopping Homestead Project..."
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Detect the original user if running with sudo
if [ -n "$SUDO_USER" ]; then
    ORIGINAL_USER="$SUDO_USER"
else
    ORIGINAL_USER="$USER"
fi

# Stop Frontend
if [ -f logs/frontend.pid ]; then
    echo "🎨 Stopping Frontend..."
    FRONTEND_PID=$(cat logs/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID
        echo "   Frontend stopped (PID: $FRONTEND_PID)"
    else
        echo "   Frontend process not found (PID: $FRONTEND_PID)"
    fi
    rm logs/frontend.pid
else
    echo "🎨 No Frontend PID file found, attempting to find and kill process..."
    pkill -f "expo start" || echo "   No Frontend process found"
fi
echo ""

# Stop Backend
if [ -f logs/backend.pid ]; then
    echo "⚙️  Stopping Backend..."
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID
        echo "   Backend stopped (PID: $BACKEND_PID)"
    else
        echo "   Backend process not found (PID: $BACKEND_PID)"
    fi
    rm logs/backend.pid
else
    echo "⚙️  No Backend PID file found, attempting to find and kill process..."
    pkill -f "node.*backend" || echo "   No Backend process found"
fi
echo ""

# Stop MongoDB if Docker is installed
if command -v docker &> /dev/null; then
    echo "📦 Stopping MongoDB..."
    cd mongo
    ./stop.sh
    cd ..
    echo ""
else
    echo "📦 Docker not found - skipping MongoDB stop (using cloud MongoDB)"
    echo ""
fi

echo "✅ All services stopped!"
echo ""
echo "Note: Log files are preserved in the logs/ directory"
