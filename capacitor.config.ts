import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.estocks.app',
  appName: 'Estocks',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    // For development - your computer's IP address
    url: 'http://192.168.4.90:3000', // Replace with your actual IP
    cleartext: true // Allow HTTP for development
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
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
