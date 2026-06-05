#!/bin/bash

echo "Stopping Homestead Project..."
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Stop Frontend with PM2
echo "Stopping Frontend..."
if pm2 describe homestead-frontend > /dev/null 2>&1; then
    pm2 stop homestead-frontend
    echo "   Frontend stopped"
else
    echo "   Frontend not running"
fi
echo ""

# Stop Backend with PM2
echo "Stopping Backend..."
if pm2 describe homestead-backend > /dev/null 2>&1; then
    pm2 stop homestead-backend
    echo "   Backend stopped"
else
    echo "   Backend not running"
fi
echo ""

# Stop MongoDB if Docker is installed
if command -v docker &> /dev/null; then
    echo "Stopping MongoDB..."
    cd mongo
    ./stop.sh
    cd ..
    echo ""
else
    echo "Docker not found - skipping MongoDB stop (using cloud MongoDB)"
    echo ""
fi

# Save PM2 state
pm2 save

echo "All services stopped!"
echo ""
echo "To completely remove processes from PM2: pm2 delete all"
