#!/bin/bash

# Docker run script for Soft Robot Application (Frontend + Backend)
set -e

echo "🐳 Building and running Soft Robot Application..."

# Generate a secure secret key if not provided
if [ -z "$SECRET_KEY" ]; then
    export SECRET_KEY=$(openssl rand -hex 32)
    echo "🔑 Generated SECRET_KEY: $SECRET_KEY"
fi

# Build and run both services
echo "📦 Building and starting services..."
docker-compose up -d --build

echo "✅ Application is running!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Documentation: http://localhost:8000/docs"
echo ""
echo "To view logs:"
echo "  All services: docker-compose logs -f"
echo "  Frontend only: docker-compose logs -f frontend"
echo "  Backend only: docker-compose logs -f backend"
echo ""
echo "To stop all services: docker-compose down"
echo "To stop and remove volumes: docker-compose down -v"
