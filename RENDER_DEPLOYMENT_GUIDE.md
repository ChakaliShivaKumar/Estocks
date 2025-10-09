# Render Deployment Guide for Estocks

This guide will help you deploy your Estocks app to Render and create a mobile APK that connects to your Render server.

## 🚀 Step 1: Deploy to Render

### Option A: Using Render Dashboard (Recommended)

1. **Create a new Web Service on Render:**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure the service:**
   - **Name:** `estocks-app` (or your preferred name)
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build:render`
   - **Start Command:** `npm run start:render`
   - **Health Check Path:** `/health`

3. **Set Environment Variables:**
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=your_neon_database_url
   JWT_SECRET=your_jwt_secret_key
   ```

### Option B: Using Render.yaml (Alternative)

1. **Push your code to GitHub** with the `render.yaml` file
2. **Connect repository to Render**
3. **Render will automatically detect and deploy** using the configuration

## 📱 Step 2: Build Mobile APK for Render

Once your Render server is deployed and running:

### 1. Get Your Render URL
Your server will be available at: `https://your-app-name.onrender.com`

### 2. Build the APK
```bash
# Replace with your actual Render URL
./deploy-render-apk.sh https://your-app-name.onrender.com
```

### 3. Alternative Manual Build
```bash
# Update Capacitor config
cp capacitor.config.render.ts capacitor.config.ts
# Edit capacitor.config.ts and replace the URL with your Render URL

# Build and sync
npm run build:mobile
npm run sync:android

# Build APK
cd android && ./gradlew assembleDebug
cd .. && cp android/app/build/outputs/apk/debug/app-debug.apk Estocks-render-production.apk
```

## 🔧 Step 3: Test Your Deployment

### 1. Test Server Health
```bash
curl https://your-app-name.onrender.com/health
```

### 2. Test API Endpoints
```bash
curl https://your-app-name.onrender.com/api
```

### 3. Test Mobile App
- Install `Estocks-render-production.apk` on Android device
- Launch the app
- Verify it connects to your Render server
- Test login, contests, and trading features

## 📋 Environment Variables Required

Make sure these are set in your Render dashboard:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `10000` |
| `DATABASE_URL` | Neon database connection string | `postgresql://...` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key` |

## 🔍 Troubleshooting

### Server Issues
- **502 Bad Gateway:** Check if `DATABASE_URL` and `JWT_SECRET` are set
- **Build Failed:** Ensure `build:render` script works locally
- **Health Check Failed:** Verify database connection

### Mobile App Issues
- **Connection Timeout:** Check if Render URL is correct in Capacitor config
- **CORS Errors:** Verify server CORS configuration allows mobile origins
- **Login Issues:** Check if JWT_SECRET matches between server and app

### Common Commands
```bash
# Test local render server
npm run build:render && npm run start:render

# Test health endpoint
curl http://localhost:10000/health

# Rebuild APK with new URL
./deploy-render-apk.sh https://your-new-url.onrender.com
```

## 📊 Monitoring

- **Render Dashboard:** Monitor server performance and logs
- **Health Endpoint:** `https://your-app.onrender.com/health`
- **Server Logs:** Available in Render dashboard

## 🎯 Production Checklist

- [ ] Server deployed to Render
- [ ] Environment variables configured
- [ ] Health check passing
- [ ] Database connected
- [ ] Mobile APK built with correct Render URL
- [ ] App tested on mobile device
- [ ] All features working (login, contests, trading)

## 🔄 Updates

To update your deployment:

1. **Update code and push to GitHub**
2. **Render will auto-deploy** (if auto-deploy is enabled)
3. **Rebuild APK** if needed: `./deploy-render-apk.sh https://your-url.onrender.com`
4. **Test the updated app**

Your Estocks app is now ready for production deployment! 🎉
