#!/bin/bash

# Start the Python backend
echo "Starting Python backend..."
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Start Tauri development
echo "Starting Tauri development..."
cd ../frontend
npm run tauri dev

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null" EXIT
