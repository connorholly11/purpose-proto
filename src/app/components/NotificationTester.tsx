'use client';

import { useState, useEffect } from 'react';
import { 
  checkNotificationSupport, 
  registerServiceWorker, 
  requestNotificationPermission,
  scheduleNotification
} from '@/lib/utils/notifications';

export default function NotificationTester() {
  const [status, setStatus] = useState<{
    serviceWorkerSupported: boolean;
    notificationsSupported: boolean;
    permission: NotificationPermission | null;
    registered: boolean;
  }>({
    serviceWorkerSupported: false,
    notificationsSupported: false,
    permission: null,
    registered: false
  });

  const [loading, setLoading] = useState(false);
  const [notificationScheduled, setNotificationScheduled] = useState(false);
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    // Check support when component mounts
    const { serviceWorkerSupported, notificationsSupported } = checkNotificationSupport();
    
    setStatus(prev => ({
      ...prev,
      serviceWorkerSupported,
      notificationsSupported,
      permission: notificationsSupported ? Notification.permission : null
    }));

    // Register service worker if supported
    if (serviceWorkerSupported) {
      registerServiceWorker().then(registration => {
        setStatus(prev => ({
          ...prev,
          registered: !!registration
        }));
      });
    }
  }, []);

  const handleRequestPermission = async () => {
    setLoading(true);
    try {
      const permission = await requestNotificationPermission();
      setStatus(prev => ({
        ...prev,
        permission
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setLoading(true);
    setNotificationScheduled(false);
    
    try {
      // Schedule a notification in X seconds
      const success = await scheduleNotification(
        'Notification Test',
        { 
          body: `This is a test notification that was scheduled ${seconds} seconds ago.`,
          delay: seconds * 1000
        }
      );
      
      if (success) {
        setNotificationScheduled(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">PWA Notification Tester</h2>
      
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <span className="mr-2">Service Worker Support:</span>
          <span className={`text-sm font-semibold ${status.serviceWorkerSupported ? 'text-green-600' : 'text-red-600'}`}>
            {status.serviceWorkerSupported ? 'Supported' : 'Not Supported'}
          </span>
        </div>
        
        <div className="flex items-center mb-2">
          <span className="mr-2">Notifications Support:</span>
          <span className={`text-sm font-semibold ${status.notificationsSupported ? 'text-green-600' : 'text-red-600'}`}>
            {status.notificationsSupported ? 'Supported' : 'Not Supported'}
          </span>
        </div>
        
        <div className="flex items-center mb-2">
          <span className="mr-2">Service Worker Registration:</span>
          <span className={`text-sm font-semibold ${status.registered ? 'text-green-600' : 'text-yellow-600'}`}>
            {status.registered ? 'Registered' : 'Not Registered'}
          </span>
        </div>
        
        <div className="flex items-center mb-2">
          <span className="mr-2">Notification Permission:</span>
          <span className={`text-sm font-semibold ${
            status.permission === 'granted' ? 'text-green-600' : 
            status.permission === 'denied' ? 'text-red-600' : 'text-yellow-600'
          }`}>
            {status.permission || 'unknown'}
          </span>
        </div>
      </div>
      
      {status.notificationsSupported && status.permission !== 'granted' && (
        <button
          onClick={handleRequestPermission}
          disabled={loading || status.permission === 'denied'}
          className="px-4 py-2 bg-blue-600 text-white rounded-md mr-2 disabled:bg-gray-400"
        >
          {loading ? 'Requesting...' : 'Request Permission'}
        </button>
      )}
      
      {status.notificationsSupported && status.permission === 'granted' && (
        <>
          <div className="flex items-center mb-4">
            <label htmlFor="seconds" className="mr-2">Delay (seconds):</label>
            <input
              id="seconds"
              type="number"
              min="5"
              max="60"
              value={seconds}
              onChange={(e) => setSeconds(Math.max(5, Math.min(60, parseInt(e.target.value) || 30)))}
              className="border rounded-md px-2 py-1 w-16 mr-2"
            />
            <button
              onClick={handleTestNotification}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-gray-400"
            >
              {loading ? 'Scheduling...' : 'Test Notification'}
            </button>
          </div>
          
          {notificationScheduled && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm">
                Notification scheduled! It will appear in <strong>{seconds} seconds</strong>.
                You can now minimize the app or go to your home screen to test if the notification appears.
              </p>
            </div>
          )}
        </>
      )}
      
      {!status.notificationsSupported && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm">
            Your browser doesn't support notifications or service workers. 
            Please try using a modern browser like Chrome, Firefox, or Edge.
          </p>
        </div>
      )}
    </div>
  );
} 