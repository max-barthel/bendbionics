#!/bin/bash

# Docker run script for Soft Robot Backend
set -e

echo "🐳 Building and running Soft Robot Backend..."

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t soft-robot-backend .

# Run the container
echo "🚀 Starting container..."
docker run -d \
  --name soft-robot-backend \
  -p 8000:8000 \
  -e DEBUG=false \
  -e LOG_LEVEL=INFO \
  -e DATABASE_URL=sqlite:///./soft_robot.db \
  -e SECRET_KEY=$(openssl rand -hex 32) \
  -e CORS_ORIGINS='["http://localhost:5173"]' \
  -e CORS_ALLOW_ALL_ORIGINS=false \
  -v $(pwd)/soft_robot.db:/app/soft_robot.db \
  --restart unless-stopped \
  soft-robot-backend

echo "✅ Backend is running on http://localhost:8000"
echo "📚 API documentation available at http://localhost:8000/docs"
echo ""
echo "To stop the container: docker stop soft-robot-backend"
echo "To view logs: docker logs -f soft-robot-backend"
echo "To remove the container: docker rm soft-robot-backend"
