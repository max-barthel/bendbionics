# Soft Robot Simulator

A modern desktop application for simulating soft robot kinematics using the Piecewise Constant Curvature (PCC) model, built with Tauri for optimal performance.

## Features

- **3D visualization** of robot segments with real-time updates
- **Real-time parameter adjustment** with live preview
- **Unit conversion** (degrees/radians, mm/cm/m)
- **Preset Management**: Save and load configurations
- **User Authentication**: Secure login for saving presets
- **Native Performance**: Built with Tauri for desktop-optimized experience

## Setup

### Prerequisites

- **Rust**: Install from [rustup.rs](https://rustup.rs/)
- **Node.js**: Version 18 or higher
- **Python**: Version 3.8 or higher

### Development Mode

1. **Backend**: `cd backend && pip install -r requirements.txt`
2. **Frontend**: `cd frontend && npm install`
3. **Run**: `./dev-tauri.sh` (starts backend and Tauri development)

### Production Build

```bash
# Build desktop app
./build-tauri.sh
```

## API Documentation

Visit `http://localhost:8000/docs` for interactive API docs

## Desktop App

This application is available as a **native desktop app**:

- **Cross-platform**: Windows, macOS, Linux
- **Lightweight**: ~10-50MB vs Electron's 100-200MB
- **Fast startup**: Native performance
- **Automatic updates**: Built-in update mechanism

## Usage

1. **Start the app** and begin using it immediately
2. **Adjust parameters** and see real-time 3D visualization
3. **Save your work**: Use the Preset Manager to save configurations
4. **Share and collaborate**: Load presets and share with others
