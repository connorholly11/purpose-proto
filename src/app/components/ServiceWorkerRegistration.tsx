'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/utils/notifications';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Register service worker when the component mounts
    if ('serviceWorker' in navigator) {
      registerServiceWorker().then(registration => {
        if (registration) {
          console.log('Service worker registered for PWA functionality');
        }
      }).catch(error => {
        console.error('Service worker registration failed:', error);
      });
    }
  }, []);

  // This component doesn't render anything
  return null;
} 