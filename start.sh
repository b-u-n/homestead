#!/bin/bash

echo "Starting Homestead Project..."
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "PM2 not found. Installing globally..."
    npm install -g pm2
fi

# Create logs directory
mkdir -p logs

# Check if Docker is installed and start MongoDB if available
if command -v docker &> /dev/null; then
    echo "Starting MongoDB (local Docker)..."
    cd mongo
    ./start.sh
    if [ $? -ne 0 ]; then
        echo "Failed to start MongoDB. Exiting."
        exit 1
    fi
    cd ..
    echo ""
    sleep 2
else
    echo "Docker not found - skipping local MongoDB (using cloud MongoDB)"
    echo ""
fi

# Start/Restart Backend with PM2
echo "Starting Backend..."
if pm2 describe homestead-backend > /dev/null 2>&1; then
    pm2 restart homestead-backend
    echo "   Backend restarted"
else
    pm2 start npm --name "homestead-backend" --cwd "$SCRIPT_DIR/backend" -- run dev
    echo "   Backend started"
fi
echo ""

# Wait a bit for backend to start
sleep 2

# Start/Restart Frontend with PM2
echo "Starting Frontend..."
if pm2 describe homestead-frontend > /dev/null 2>&1; then
    pm2 restart homestead-frontend
    echo "   Frontend restarted"
else
    pm2 start npx --name "homestead-frontend" --cwd "$SCRIPT_DIR/frontend" -- expo start --lan --port 9001
    echo "   Frontend started"
fi
echo ""

# Save PM2 process list (for startup persistence)
pm2 save

echo "All services started!"
echo ""
echo "-------------------------------------------"
echo "Service Status:"
echo "-------------------------------------------"
echo "   MongoDB:       mongodb://localhost:27017 (or Atlas cloud)"
echo "   Mongo Express: http://localhost:8081 (if using Docker)"
echo "   Backend API:   http://localhost:9000"
echo "   Frontend:      http://localhost:9001 (LAN accessible)"
echo ""
echo "PM2 Commands:"
echo "   Status:        pm2 status"
echo "   Logs:          pm2 logs"
echo "   Backend logs:  pm2 logs homestead-backend"
echo "   Frontend logs: pm2 logs homestead-frontend"
echo "   Monitor:       pm2 monit"
echo ""
echo "To enable startup on boot: pm2 startup"
echo "To stop all services: ./stop.sh"
echo "-------------------------------------------"
