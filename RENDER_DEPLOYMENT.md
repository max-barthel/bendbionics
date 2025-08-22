# 🚀 Render Deployment Guide

This guide will walk you through deploying your Soft Robot App to Render.

## 📋 Prerequisites

1. **GitHub Account** - Your code must be in a GitHub repository
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **GitHub Repository** - Your code must be pushed to GitHub

## 🚀 Step-by-Step Deployment

### Step 1: Push Your Code to GitHub

Make sure your code is pushed to a GitHub repository:

```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### Step 2: Set Up Render Project

1. **Go to [render.com](https://render.com)** and sign in
2. **Click "New +"**
3. **Select "Blueprint"** (this will use our render.yaml file)
4. **Connect your GitHub repository**
5. **Click "Connect"**

### Step 3: Configure Your Blueprint

1. **Render will detect the `render.yaml` file**
2. **Review the services** that will be created:
   - `soft-robot-backend` (Python web service)
   - `soft-robot-frontend` (Static site)
   - `soft-robot-db` (PostgreSQL database)
3. **Click "Apply"**

### Step 4: Wait for Deployment

1. **Render will automatically deploy all services**
2. **This may take 5-10 minutes** for the first deployment
3. **Monitor the deployment logs** for any issues

## 🔧 Environment Variables

The `render.yaml` file automatically configures these environment variables:

### Backend Variables

- `DATABASE_URL` - Automatically set from the database
- `SECRET_KEY` - Automatically generated
- `CORS_ORIGINS` - Set to your frontend URL
- `DEBUG` - Set to false

### Frontend Variables

- `VITE_API_URL` - Set to your backend URL

## 🌐 Accessing Your App

After deployment, you'll get these URLs:

1. **Frontend**: `https://soft-robot-frontend.onrender.com`
2. **Backend API**: `https://soft-robot-backend.onrender.com`
3. **API Docs**: `https://soft-robot-backend.onrender.com/docs`

## 🔍 Troubleshooting

### Common Issues

1. **Build Fails**

   - Check the build logs in Render
   - Ensure all dependencies are in `requirements.txt` and `package.json`

2. **Database Connection Issues**

   - The database connection is automatically configured
   - Check if the database service is running

3. **CORS Errors**

   - The CORS origins are automatically configured
   - Check browser console for specific errors

4. **Frontend Can't Connect to Backend**
   - Verify the backend service is running
   - Check the frontend build logs

### Getting Help

- **Render Logs**: Check the logs tab in your Render dashboard
- **Render Documentation**: [docs.render.com](https://docs.render.com)
- **Render Community**: Join their Discord for support

## 💰 Cost Management

Render's free tier includes:

- **Web Services**: 750 hours/month (enough for 24/7 operation)
- **Static Sites**: Unlimited
- **PostgreSQL**: 90 days free trial, then $7/month

## 🔄 Updating Your App

To update your app:

1. **Make changes to your code**
2. **Push to GitHub**
3. **Render will automatically redeploy**

## 🎯 Manual Deployment (Alternative)

If the Blueprint doesn't work, you can deploy manually:

### Backend Service

1. **Create a new Web Service**
2. **Connect your GitHub repository**
3. **Set build command**: `pip install -r backend/requirements.txt`
4. **Set start command**: `cd backend && python render_start.py`

### Frontend Service

1. **Create a new Static Site**
2. **Connect your GitHub repository**
3. **Set build command**: `cd frontend && npm install && npm run build`
4. **Set publish directory**: `frontend/dist`

### Database

1. **Create a new PostgreSQL database**
2. **Note the connection details**

---

**🎉 Congratulations!** Your Soft Robot App is now deployed to Render!
