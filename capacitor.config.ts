import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.estocks.app',
  appName: 'Estocks',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    // Production server on Render
    url: 'https://estocks-1.onrender.com',
    cleartext: false // HTTPS for production
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
