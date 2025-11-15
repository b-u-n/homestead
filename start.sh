#!/bin/bash

echo "🚀 Starting Homestead Project..."
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Detect the original user if running with sudo
if [ -n "$SUDO_USER" ]; then
    ORIGINAL_USER="$SUDO_USER"
    # Load nvm for the original user
    export NVM_DIR="/home/$ORIGINAL_USER/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
else
    ORIGINAL_USER="$USER"
    # Load nvm for current user
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# Create logs directory and fix permissions
mkdir -p logs
chown -R $ORIGINAL_USER:$ORIGINAL_USER logs 2>/dev/null || true

# Check if Docker is installed and start MongoDB if available
if command -v docker &> /dev/null; then
    echo "📦 Starting MongoDB (local Docker)..."
    cd mongo
    ./start.sh
    if [ $? -ne 0 ]; then
        echo "❌ Failed to start MongoDB. Exiting."
        exit 1
    fi
    cd ..
    echo ""
    # Wait a bit for MongoDB to be fully ready
    sleep 2
else
    echo "📦 Docker not found - skipping local MongoDB (using cloud MongoDB)"
    echo ""
fi

# Start Backend with nodemon for auto-restart (run as original user if using sudo)
echo "⚙️  Starting Backend (with auto-restart)..."
cd backend
if [ -n "$SUDO_USER" ]; then
    sudo -u $ORIGINAL_USER bash -c "source $NVM_DIR/nvm.sh && nohup npm run dev > ../logs/backend.log 2>&1 & echo \$! > ../logs/backend.pid"
else
    nohup npm run dev > ../logs/backend.log 2>&1 &
    echo $! > ../logs/backend.pid
fi
BACKEND_PID=$(cat ../logs/backend.pid)
echo "   Backend PID: $BACKEND_PID (auto-restart enabled)"
echo "   Logs: logs/backend.log"
cd ..
echo ""

# Wait a bit for backend to start
sleep 2

# Start Frontend (run as original user if using sudo)
echo "🎨 Starting Frontend..."
cd frontend
if [ -n "$SUDO_USER" ]; then
    sudo -u $ORIGINAL_USER bash -c "source $NVM_DIR/nvm.sh && nohup npx expo start --lan --port 9001 > ../logs/frontend.log 2>&1 & echo \$! > ../logs/frontend.pid"
else
    nohup npx expo start --lan --port 9001 > ../logs/frontend.log 2>&1 &
    echo $! > ../logs/frontend.pid
fi
FRONTEND_PID=$(cat ../logs/frontend.pid)
echo "   Frontend PID: $FRONTEND_PID"
echo "   Logs: logs/frontend.log"
cd ..
echo ""

echo "✅ All services started!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Service Status:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   MongoDB:       mongodb://localhost:27017 (or Atlas cloud)"
echo "   Mongo Express: http://localhost:8081 (if using Docker)"
echo "   Backend API:   http://localhost:9000"
echo "   Frontend:      http://localhost:9001 (LAN accessible)"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f logs/backend.log"
echo "   Frontend: tail -f logs/frontend.log"
echo "   MongoDB:  cd mongo && docker-compose logs -f"
echo ""
echo "🛑 To stop all services: ./stop.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
