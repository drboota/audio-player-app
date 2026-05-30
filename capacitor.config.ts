import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.audio.player',
  appName: 'مشغل الصوت',
  webDir: 'dist',
  android: {
    backgroundColor: '#0F0F1A',
    allowMixedContent: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0F0F1A'
    }
  }
};

export default config;