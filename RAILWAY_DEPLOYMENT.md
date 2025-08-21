# 🚀 Railway Deployment Guide

This guide will walk you through deploying your Soft Robot App to Railway.

## 📋 Prerequisites

1. **GitHub Account** - Your code must be in a GitHub repository
2. **Railway Account** - Sign up at [railway.app](https://railway.app)
3. **PostgreSQL Database** - We'll set this up on Railway

## 🚀 Step-by-Step Deployment

### Step 1: Push Your Code to GitHub

Make sure your code is pushed to a GitHub repository:

```bash
git add .
git commit -m "Add Railway deployment configuration"
git push origin main
```

### Step 2: Set Up Railway Project

1. **Go to [railway.app](https://railway.app)** and sign in
2. **Click "New Project"**
3. **Select "Deploy from GitHub repo"**
4. **Choose your repository**
5. **Railway will automatically detect your services**

### Step 3: Set Up PostgreSQL Database

1. **In your Railway project, click "New"**
2. **Select "Database" → "PostgreSQL"**
3. **Railway will create a PostgreSQL database**
4. **Note down the connection details** (you'll need them for environment variables)

### Step 4: Configure Backend Service

1. **Railway should have detected your backend** (it will use the root `railway.json`)
2. **Go to your backend service settings**
3. **Add these environment variables:**

```
DATABASE_URL=postgresql://username:password@host:port/database
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=["https://your-frontend-domain.railway.app"]
DEBUG=false
```

**Important:** Replace the `DATABASE_URL` with the actual connection string from your PostgreSQL service.

### Step 5: Configure Frontend Service

1. **Railway should have detected your frontend** (it will use `frontend/railway.json`)
2. **Go to your frontend service settings**
3. **Add this environment variable:**

```
RAILWAY_STATIC_URL=https://your-backend-domain.railway.app
```

**Important:** Replace with the actual backend URL from Railway.

### Step 6: Deploy

1. **Railway will automatically deploy when you push changes**
2. **Or manually trigger deployment from the Railway dashboard**
3. **Monitor the deployment logs** for any issues

## 🔧 Environment Variables Reference

### Backend Variables

| Variable       | Description                  | Example                               |
| -------------- | ---------------------------- | ------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:port/db` |
| `SECRET_KEY`   | JWT secret key               | `your-secret-key-here`                |
| `CORS_ORIGINS` | Allowed frontend domains     | `["https://your-app.railway.app"]`    |
| `DEBUG`        | Debug mode                   | `false`                               |

### Frontend Variables

| Variable             | Description     | Example                            |
| -------------------- | --------------- | ---------------------------------- |
| `RAILWAY_STATIC_URL` | Backend API URL | `https://your-backend.railway.app` |

## 🌐 Accessing Your App

After deployment:

1. **Frontend**: `https://your-frontend-service.railway.app`
2. **Backend API**: `https://your-backend-service.railway.app`
3. **API Docs**: `https://your-backend-service.railway.app/docs`

## 🔍 Troubleshooting

### Common Issues

1. **Build Fails**

   - Check the build logs in Railway
   - Ensure all dependencies are in `requirements.txt`

2. **Database Connection Issues**

   - Verify `DATABASE_URL` is correct
   - Check if PostgreSQL service is running

3. **CORS Errors**

   - Ensure `CORS_ORIGINS` includes your frontend URL
   - Check browser console for specific errors

4. **Frontend Can't Connect to Backend**
   - Verify `RAILWAY_STATIC_URL` is set correctly
   - Check if backend service is running

### Getting Help

- **Railway Logs**: Check the logs tab in your Railway dashboard
- **Railway Discord**: Join their community for support
- **Documentation**: [docs.railway.app](https://docs.railway.app)

## 💰 Cost Management

Railway's free tier includes:

- $5/month credit
- Enough for small applications
- Automatic scaling

Monitor your usage in the Railway dashboard to stay within limits.

## 🔄 Updating Your App

To update your app:

1. **Make changes to your code**
2. **Push to GitHub**
3. **Railway will automatically redeploy**

Or manually redeploy from the Railway dashboard.

---

**🎉 Congratulations!** Your Soft Robot App is now deployed to Railway!
