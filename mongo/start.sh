#!/bin/bash

echo "Starting MongoDB for Homestead..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Start MongoDB containers
docker-compose up -d

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to be ready..."
sleep 10

# Check if containers are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ MongoDB is running!"
    echo ""
    echo "📊 Mongo Express (Web UI): http://localhost:8081"
    echo "   Username: admin"
    echo "   Password: homestead123"
    echo ""
    echo "🔗 MongoDB Connection String: mongodb://admin:homestead123@localhost:27017/homestead"
    echo ""
    echo "To stop: cd mongo && docker-compose down"
    echo "To view logs: cd mongo && docker-compose logs -f"
else
    echo "❌ Failed to start MongoDB containers"
    docker-compose logs
fi