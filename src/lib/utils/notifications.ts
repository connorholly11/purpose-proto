// Utility functions for handling notifications in the PWA

// Check if the browser supports service workers and notifications
export const checkNotificationSupport = (): {
  serviceWorkerSupported: boolean;
  notificationsSupported: boolean;
} => {
  const serviceWorkerSupported = 'serviceWorker' in navigator;
  const notificationsSupported = 'Notification' in window;
  
  return { serviceWorkerSupported, notificationsSupported };
};

// Register the service worker
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.error('Service workers are not supported in this browser');
    return null;
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    console.log('Service Worker registered successfully:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.error('Notifications not supported in this browser');
    return 'denied';
  }
  
  // If permission is already granted, return it
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  
  // Request permission
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

// Show a notification after a delay
export const scheduleNotification = async (
  title: string,
  options: { body: string; delay: number; url?: string }
): Promise<boolean> => {
  const { body, delay, url } = options;
  
  // Check if notifications are supported and permission is granted
  if (!('Notification' in window)) {
    console.error('Notifications not supported');
    return false;
  }
  
  if (Notification.permission !== 'granted') {
    console.error('Notification permission not granted');
    return false;
  }
  
  // Use a simple setTimeout for the test notification
  setTimeout(async () => {
    // If the service worker is active, use it to show the notification
    if (navigator.serviceWorker.controller) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          data: { url: url || window.location.href }
        });
        return true;
      } catch (error) {
        console.error('Error showing notification via service worker:', error);
      }
    }
    
    // Fallback to regular notification if service worker is not controlling the page
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico'
      });
      return true;
    } catch (error) {
      console.error('Error showing notification directly:', error);
      return false;
    }
  }, delay);
  
  return true;
}; 