 import type { CapacitorConfig } from '@capacitor/cli';
 
 const config: CapacitorConfig = {
   appId: 'app.lovable.659910ed16a14aea89d764e391080b25',
   appName: 'log-hub-marketplace',
   webDir: 'dist',
   server: {
     url: 'https://659910ed-16a1-4aea-89d7-64e391080b25.lovableproject.com?forceHideBadge=true',
     cleartext: true
   },
   plugins: {
     SplashScreen: {
       launchShowDuration: 2000,
       backgroundColor: '#151922',
       showSpinner: false,
       androidScaleType: 'CENTER_CROP',
       splashFullScreen: true,
       splashImmersive: true
     },
     StatusBar: {
       style: 'dark',
       backgroundColor: '#151922'
     }
   }
 };
 
 export default config;