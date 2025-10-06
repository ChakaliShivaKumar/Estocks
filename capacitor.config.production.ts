import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.estocks.app',
  appName: 'Estocks',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    // Replace with your production URL
    url: 'https://your-app-name.railway.app', // UPDATE THIS
    cleartext: false // Use HTTPS for production
  },
  android: {
    allowMixedContent: false, // Disable for production
    captureInput: true,
    webContentsDebuggingEnabled: false // Disable for production
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
