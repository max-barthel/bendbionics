#!/bin/bash

echo "Building Soft Robot Simulator with Tauri..."

cd frontend
npm run build
npm run tauri build

echo "Build complete! Check src-tauri/target/release/ for the executable."
