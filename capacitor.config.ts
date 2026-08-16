import type { CapacitorConfig } from '@capacitor/cli';

// Set CAP_LIVE_RELOAD=1 to develop against the Lovable sandbox preview.
// Store builds (Play Store / App Store) MUST be built without it so the
// app ships the bundled `dist` build instead of a remote URL.
const useLiveReload = process.env.CAP_LIVE_RELOAD === '1';

const config: CapacitorConfig = {
  appId: 'site.loghubmarketplace.app',
  appName: 'Log Hub Marketplace',
  webDir: 'dist',
  ...(useLiveReload
    ? {
        server: {
          url: 'https://659910ed-16a1-4aea-89d7-64e391080b25.lovableproject.com?forceHideBadge=true',
          cleartext: true,
        },
      }
    : {}),
  ios: {
    contentInset: 'always',
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#151922',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#151922',
    },
  },
};

export default config;
