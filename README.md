# Soft Robot Kinematics Application

A web-based application for simulating soft robot kinematics using the Piecewise Constant Curvature (PCC) model.

## Features

- **Guest Mode**: Use the app immediately without registration
- **3D visualization** of robot segments with real-time updates
- **Real-time parameter adjustment** with live preview
- **Unit conversion** (degrees/radians, mm/cm/m)
- **Preset Management**: Save and load configurations (requires login)
- **RESTful API** for computations
- **User Authentication**: Optional login for saving presets

## User Experience

### Guest Mode

- **No registration required** to explore the app
- **Full functionality** for robot simulation and visualization
- **Seamless upgrade** to authenticated mode when needed

### Authenticated Mode

- **Save configurations** as presets
- **Load previous configurations**
- **Share presets** with other users
- **Personal workspace** with your saved configurations

## Setup

1. **Backend**: `cd backend && pip install -r requirements.txt`
2. **Frontend**: `cd frontend && npm install`
3. **Run**: See `run_back-_and_frontend.txt`

## API Documentation

Visit `http://localhost:8000/docs` for interactive API docs

## Usage

1. **Start the app** and begin using it immediately in guest mode
2. **Adjust parameters** and see real-time 3D visualization
3. **When ready to save**: Click "Sign In" to create an account
4. **Save your work**: Use the Preset Manager to save configurations
5. **Share and collaborate**: Load presets and share with others
