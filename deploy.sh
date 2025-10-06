#!/bin/bash

# Deployment script for Estocks app

echo "🚀 Starting deployment process..."

# Check if production URL is provided
if [ -z "$1" ]; then
    echo "❌ Please provide your production URL as an argument"
    echo "Usage: ./deploy.sh https://your-app-name.railway.app"
    exit 1
fi

PRODUCTION_URL=$1

echo "📱 Updating Capacitor config for production..."
# Update the production config with the actual URL
sed -i '' "s|https://your-app-name.railway.app|$PRODUCTION_URL|g" capacitor.config.production.ts

echo "🔧 Building for production..."
npm run build:mobile

echo "📲 Syncing with Android..."
cp capacitor.config.production.ts capacitor.config.ts
npm run sync:android

echo "🏗️ Building Android APK..."
cd android
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
./gradlew assembleDebug
cd ..

echo "📦 Copying APK..."
cp android/app/build/outputs/apk/debug/app-debug.apk ./Estocks-production.apk

echo "✅ Deployment complete!"
echo "📱 Your production APK is ready: Estocks-production.apk"
echo "🌐 App will connect to: $PRODUCTION_URL"
echo ""
echo "📋 Next steps:"
echo "1. Deploy your backend to Railway/Render"
echo "2. Share the APK with remote users"
echo "3. Make sure your backend is running on $PRODUCTION_URL"
