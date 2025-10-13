#!/bin/bash

# Script to bundle the Python backend with the Tauri desktop app

echo "🔧 Bundling Python backend with desktop app..."

# Get the app bundle path
APP_BUNDLE="frontend/src-tauri/target/release/bundle/macos/Soft Robot Simulator.app"
BACKEND_DEST="$APP_BUNDLE/Contents/Resources/backend"

# Create the backend directory in the app bundle
mkdir -p "$BACKEND_DEST"

# Copy the entire backend directory
echo "📦 Copying backend files..."
cp -r backend/* "$BACKEND_DEST/"

# Create a Python requirements file for the bundled backend
echo "📝 Creating requirements file..."
cat > "$BACKEND_DEST/requirements.txt" << EOF
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlmodel==0.0.14
python-multipart==0.0.6
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
bcrypt==4.0.1
python-dotenv==1.0.0
numpy==1.24.3
scipy==1.11.4
pytest==7.4.3
pytest-cov==4.1.0
pytest-asyncio==0.21.1
httpx==0.25.2
EOF

# Create a startup script for the backend
echo "🚀 Creating backend startup script..."
cat > "$BACKEND_DEST/start_backend.py" << 'EOF'
#!/usr/bin/env python3
import sys
import os
import subprocess

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Start the uvicorn server
if __name__ == "__main__":
    subprocess.run([
        sys.executable, "-m", "uvicorn",
        "app.main:app",
        "--host", "127.0.0.1",
        "--port", "8000"
    ])
EOF

chmod +x "$BACKEND_DEST/start_backend.py"

echo "✅ Backend bundled successfully!"
echo "📍 Backend location: $BACKEND_DEST"
echo ""
echo "To test the bundled backend:"
echo "cd '$BACKEND_DEST' && python start_backend.py"
