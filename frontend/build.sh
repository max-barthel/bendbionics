#!/bin/bash

# Build script for Render deployment
echo "Building frontend for Render..."

# Set the API URL for the build
export VITE_API_URL=https://soft-robot-backend.onrender.com

# Install dependencies
npm install

# Build the application
npm run build

echo "Frontend build complete!"
