import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.estocks.app',
  appName: 'Estocks',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    // For production - Render server URL (will be updated with actual URL)
    url: 'https://your-render-app-name.onrender.com',
    cleartext: false // Use HTTPS in production
  },
  android: {
    allowMixedContent: false, // Enforce HTTPS in production
    captureInput: true,
    webContentsDebuggingEnabled: false // Disable debugging in production
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: false
    },
    StatusBar: {
      style: 'default'
    }
  }
};

export default config;
