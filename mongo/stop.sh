#!/bin/bash

echo "Stopping MongoDB for Homestead..."

docker-compose down

echo "✅ MongoDB containers stopped"
echo "Data is preserved in Docker volume 'mongo_mongodb_data'"
echo "To completely remove data: docker volume rm mongo_mongodb_data"