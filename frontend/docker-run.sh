#!/bin/bash

# Docker run script for Soft Robot Frontend
set -e

echo "🐳 Building and running Soft Robot Frontend..."

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t soft-robot-frontend .

# Run the container
echo "🚀 Starting container..."
docker run -d \
  --name soft-robot-frontend \
  -p 3000:80 \
  -e VITE_API_URL=http://localhost:8000 \
  --restart unless-stopped \
  soft-robot-frontend

echo "✅ Frontend is running on http://localhost:3000"
echo "🔗 Make sure your backend is running on http://localhost:8000"
echo ""
echo "To stop the container: docker stop soft-robot-frontend"
echo "To view logs: docker logs -f soft-robot-frontend"
echo "To remove the container: docker rm soft-robot-frontend"
