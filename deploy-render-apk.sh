#!/bin/bash

# Check if a Render URL is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <YOUR_RENDER_SERVER_URL>"
  echo "Example: $0 https://your-app-name.onrender.com"
  exit 1
fi

RENDER_URL=$1
CAPACITOR_CONFIG_FILE="capacitor.config.ts"
CAPACITOR_CONFIG_RENDER_TEMPLATE="capacitor.config.render.ts"
APK_OUTPUT_NAME="Estocks-render-production.apk"

echo "🚀 Starting Render deployment APK build..."

# 1. Update Capacitor config for Render production
echo "📱 Updating Capacitor config for Render production..."
# Copy the render template
cp "$CAPACITOR_CONFIG_RENDER_TEMPLATE" "$CAPACITOR_CONFIG_FILE"
# Replace the placeholder URL with the actual Render URL
sed -i '' "s|https://your-render-app-name.onrender.com|$RENDER_URL|g" "$CAPACITOR_CONFIG_FILE"

echo "✅ Capacitor config updated with Render URL: $RENDER_URL"

# 2. Build the web app
echo "🔧 Building for production..."
npm run build:mobile

# 3. Sync with Android platform
echo "📲 Syncing with Android..."
npm run sync:android

# 4. Build the Android APK
echo "🏗️ Building Android APK..."
cd android && ./gradlew assembleDebug

# 5. Copy the APK to the root directory
echo "📦 Copying APK..."
cd .. && cp android/app/build/outputs/apk/debug/app-debug.apk "$APK_OUTPUT_NAME"

echo "✅ Render deployment APK build complete!"
echo "📱 Your production APK is ready: $APK_OUTPUT_NAME"
echo "🌐 App will connect to: $RENDER_URL"

echo ""
echo "📋 Next steps:"
echo "1. Deploy your server to Render using the render-server.ts"
echo "2. Make sure your Render server is running on $RENDER_URL"
echo "3. Share the APK with users"
echo "4. Test the app with the live Render server"

echo ""
echo "🔧 Render deployment commands:"
echo "   Build: npm run build:render"
echo "   Start: npm run start:render"
echo "   Or use: npm run build:render && npm run start:render"
