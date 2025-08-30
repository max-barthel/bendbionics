#!/bin/bash

echo "Building Soft Robot App..."

cd frontend
npm run build
npm run tauri build

echo "Build complete! Check src-tauri/target/release/ for the executable."
