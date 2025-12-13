import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bodyfatai.app',
  appName: 'BodyFatAI',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true,
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'AAB' // or 'APK'
    }
  },
  plugins: {
    Camera: {
      permissions: {
        camera: 'This app needs access to your camera to take photos for body fat analysis.',
        photos: 'This app needs access to your photos to select images for analysis.'
      }
    }
  }
};

export default config;
