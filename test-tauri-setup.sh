#!/bin/bash

echo "Testing Tauri Setup..."

# Check if backend is running
echo "1. Checking if backend is running..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ Backend is running on port 8000"
else
    echo "   ❌ Backend is not running on port 8000"
    echo "   Starting backend..."
    cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
    sleep 3
fi

# Check if frontend builds
echo "2. Testing frontend build..."
cd frontend
if npm run build > /dev/null 2>&1; then
    echo "   ✅ Frontend builds successfully"
else
    echo "   ❌ Frontend build failed"
    exit 1
fi

# Check if Tauri can be built
echo "3. Testing Tauri build..."
source "$HOME/.cargo/env"
if npm run tauri build > /dev/null 2>&1; then
    echo "   ✅ Tauri builds successfully"
else
    echo "   ❌ Tauri build failed"
    exit 1
fi

echo "🎉 Tauri setup is working correctly!"
echo "You can now run: ./dev-tauri.sh"
