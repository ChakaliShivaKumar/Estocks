# 🚀 Deployment Guide for Remote Sharing

## Option 1: Railway (Recommended - Free Tier)

### Step 1: Prepare Your App
1. **Set up environment variables** in Railway dashboard:
   - `DATABASE_URL`: Your Neon database connection string
   - `JWT_SECRET`: Generate a secure random string (32+ characters)
   - `NODE_ENV`: Set to `production`

### Step 2: Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create new project from GitHub repo
4. Connect your Estocks repository
5. Railway will automatically detect and deploy

### Step 3: Get Your Production URL
- Railway will give you a URL like: `https://your-app-name.railway.app`
- Copy this URL for the next step

## Option 2: Render (Alternative)

### Step 1: Prepare for Render
1. Go to [render.com](https://render.com)
2. Create account and connect GitHub
3. Create new Web Service from your repo

### Step 2: Configure Render
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Environment**: `Node`
- **Branch**: `main`

## Step 4: Update Mobile App Configuration

Once you have your production URL, update the Capacitor config:

```typescript
// In capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'com.estocks.app',
  appName: 'Estocks',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    url: 'https://your-app-name.railway.app', // Your production URL
    cleartext: false // Use HTTPS for production
  },
  // ... rest of config
};
```

## Step 5: Build Production APK

```bash
# Update config and rebuild
npm run build:mobile
npm run sync:android
npm run build:android
```

## Option 3: Quick Test with ngrok (Temporary)

For immediate testing:

1. Install ngrok: `npm install -g ngrok`
2. Start your local server: `npm run dev`
3. In another terminal: `ngrok http 3000`
4. Use the ngrok URL in your Capacitor config
5. Build and test the APK

## Environment Variables Needed

Create these in your hosting service:

- `DATABASE_URL`: Your database connection string
- `JWT_SECRET`: A secure random string
- `NODE_ENV`: `production`

## Security Notes for Production

- Always use HTTPS in production
- Set secure cookies: `secure: true`
- Use proper CORS origins
- Implement rate limiting
- Add proper error handling

## Cost Estimates

- **Railway**: Free tier (500 hours/month)
- **Render**: Free tier (750 hours/month)
- **Neon Database**: Free tier (0.5GB storage)
- **Total**: $0/month for small usage
