# 🚀 Fly.io Deployment Guide

This guide will walk you through deploying your Soft Robot App to Fly.io.

## 📋 Prerequisites

1. **GitHub Account** - Your code must be in a GitHub repository
2. **Fly.io Account** - Sign up at [fly.io](https://fly.io)
3. **Fly CLI** - Install the Fly CLI tool

## 🛠️ Install Fly CLI

### macOS

```bash
brew install flyctl
```

### Windows

```bash
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

### Linux

```bash
curl -L https://fly.io/install.sh | sh
```

## 🚀 Step-by-Step Deployment

### Step 1: Push Your Code to GitHub

Make sure your code is pushed to a GitHub repository:

```bash
git add .
git commit -m "Add Fly.io deployment configuration"
git push origin main
```

### Step 2: Login to Fly.io

```bash
fly auth login
```

### Step 3: Deploy Backend Service

1. **Navigate to the backend directory:**

   ```bash
   cd backend
   ```

2. **Deploy the backend:**

   ```bash
   fly deploy
   ```

3. **Set environment variables:**
   ```bash
   fly secrets set SECRET_KEY="your-super-secret-key-here"
   fly secrets set DEBUG="false"
   fly secrets set CORS_ORIGINS='["https://soft-robot-frontend.fly.dev"]'
   ```

### Step 4: Set Up PostgreSQL Database

1. **Create a PostgreSQL database:**

   ```bash
   fly postgres create soft-robot-db
   ```

2. **Attach the database to your backend:**

   ```bash
   fly postgres attach soft-robot-db --app soft-robot-backend
   ```

3. **The DATABASE_URL will be automatically set** as a secret.

### Step 5: Deploy Frontend Service

1. **Navigate to the frontend directory:**

   ```bash
   cd ../frontend
   ```

2. **Deploy the frontend:**

   ```bash
   fly deploy
   ```

3. **Set the backend URL:**
   ```bash
   fly secrets set VITE_API_URL="https://soft-robot-backend.fly.dev"
   ```

## 🔧 Environment Variables

### Backend Variables (set as secrets)

- `DATABASE_URL` - Automatically set when attaching PostgreSQL
- `SECRET_KEY` - Your JWT secret key
- `CORS_ORIGINS` - Allowed frontend domains
- `DEBUG` - Set to false for production

### Frontend Variables (set as secrets)

- `VITE_API_URL` - Your backend API URL

## 🌐 Accessing Your App

After deployment, you'll get these URLs:

1. **Frontend**: `https://soft-robot-frontend.fly.dev`
2. **Backend API**: `https://soft-robot-backend.fly.dev`
3. **API Docs**: `https://soft-robot-backend.fly.dev/docs`

## 🔍 Troubleshooting

### Common Issues

1. **Build Fails**

   - Check the build logs with `fly logs`
   - Ensure all dependencies are in `requirements.txt`

2. **Database Connection Issues**

   - Verify the database is attached: `fly postgres list`
   - Check secrets: `fly secrets list`

3. **CORS Errors**

   - Ensure `CORS_ORIGINS` includes your frontend URL
   - Check browser console for specific errors

4. **Service Not Starting**
   - Check logs: `fly logs`
   - Verify the startup command in Dockerfile

### Useful Commands

```bash
# View logs
fly logs

# Check app status
fly status

# Scale your app
fly scale count 1

# View secrets
fly secrets list

# SSH into your app
fly ssh console
```

## 💰 Cost Management

Fly.io's free tier includes:

- **3 shared-cpu VMs** (256MB RAM each)
- **3GB persistent volume storage**
- **160GB outbound data transfer**
- **Automatic scaling** (machines stop when not in use)

## 🔄 Updating Your App

To update your app:

1. **Make changes to your code**
2. **Push to GitHub**
3. **Deploy with:**
   ```bash
   fly deploy
   ```

## 🎯 Manual Database Setup (if needed)

If you need to manually create tables:

```bash
# SSH into your backend
fly ssh console -s soft-robot-backend

# Run the table creation script
python create_tables.py
```

---

**🎉 Congratulations!** Your Soft Robot App is now deployed to Fly.io!
