import { useState, useEffect } from 'react';

export function useIsPWA() {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true
      || document.referrer.includes('android-app://');
    
    // Also check if user is on a mobile device accessing /app routes
    const isAppRoute = window.location.pathname.startsWith('/app');
    
    setIsPWA(isStandalone || isAppRoute);
  }, []);

  return isPWA;
}
