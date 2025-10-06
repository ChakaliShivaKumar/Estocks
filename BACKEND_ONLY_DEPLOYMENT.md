# 🚀 Backend-Only Deployment Guide

## Why Backend-Only?
- ✅ **Simpler deployment** - No frontend complexity
- ✅ **Faster startup** - No Vite or static file serving
- ✅ **Easier debugging** - Focus only on API issues
- ✅ **Better reliability** - Fewer moving parts
- ✅ **Mobile-first** - Perfect for mobile apps

## 🎯 Deployment Steps

### Step 1: Update Render Configuration
In your Render dashboard, update these settings:

**Build & Deploy:**
- **Build Command**: `npm run build:api`
- **Start Command**: `npm run start:api`
- **Node Version**: `18`

**Environment Variables:**
```
DATABASE_URL = your_neon_database_url
JWT_SECRET = ff4c431ac16856e3dec6cf661f9e5ad91b4a0888ca5fb027a0f556b4e481b35b
NODE_ENV = production
PORT = 10000
```

### Step 2: Deploy
1. **Push to GitHub** (already done)
2. **Render auto-deploys** from your repository
3. **Check logs** for successful startup

### Step 3: Test Your API
Once deployed, test these endpoints:

**Health Check:**
```bash
curl https://your-app.onrender.com/health
```

**API Info:**
```bash
curl https://your-app.onrender.com/api
```

**Expected Response:**
```json
{
  "name": "Estocks API",
  "version": "1.0.0",
  "description": "Backend API for Estocks trading app",
  "endpoints": {
    "auth": "/api/auth/*",
    "stocks": "/api/stocks/*",
    "contests": "/api/contests/*",
    "users": "/api/users/*",
    "health": "/health"
  }
}
```

## 📱 Update Mobile App

Once your backend is running, update the mobile app:

1. **Get your backend URL** (e.g., `https://estocks-backend.onrender.com`)
2. **Run deployment script**: `./deploy.sh https://your-backend-url.onrender.com`
3. **Install new APK** on your device

## 🔧 Local Development

**Run backend only:**
```bash
npm run dev:api
```

**Run full stack:**
```bash
npm run dev
```

## 📊 What's Included

**API Endpoints:**
- `/api/auth/*` - Authentication (login, register, logout)
- `/api/stocks/*` - Stock data and prices
- `/api/contests/*` - Trading contests
- `/api/users/*` - User profiles and data
- `/health` - Health check
- `/api` - API information

**Features:**
- ✅ CORS configured for mobile apps
- ✅ JWT authentication
- ✅ WebSocket support for real-time updates
- ✅ Database connection testing
- ✅ Error handling and logging
- ✅ Health monitoring

## 🚨 Troubleshooting

**If deployment fails:**
1. Check Render logs for error messages
2. Verify environment variables are set
3. Ensure DATABASE_URL is correct
4. Check if database allows external connections

**If API doesn't respond:**
1. Test `/health` endpoint first
2. Check database connection
3. Verify CORS settings
4. Check authentication endpoints

## 💡 Benefits

- **Faster deployment** (2-3 minutes vs 5-10 minutes)
- **Smaller bundle size** (175kb vs 1MB+)
- **Better error isolation**
- **Easier scaling**
- **Mobile-optimized**
