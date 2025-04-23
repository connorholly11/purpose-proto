import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useCallback } from 'react';
import { createAuthenticatedApi } from './api';
import { useClerkTokenGetter } from '../hooks/useClerkTokenGetter';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Setup notification handlers and listeners.
 * Returns a cleanup function to remove listeners when needed.
 */
export function setupNotifications() {
  console.log('[Push Service] Setting up notification handlers');
  
  // Set up notification received listener
  const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('[Push Service] Notification received:', notification);
  });
  
  // Set up notification response listener (when user taps on notification)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('[Push Service] Notification response received:', response);
    
    // Here you can add navigation logic to open a specific screen based on the notification
    // For example, navigate to a chat screen if the notification is about a new message
  });
  
  // Return a cleanup function
  return {
    cleanup: () => {
      console.log('[Push Service] Removing notification listeners');
      Notifications.removeNotificationSubscription(receivedSubscription);
      Notifications.removeNotificationSubscription(responseSubscription);
    }
  };
}

/**
 * Custom hook to register for push notifications.
 * Handles permission requests and token registration with the backend.
 */
export function useRegisterForPush() {
  const getToken = useClerkTokenGetter();
  
  return useCallback(async () => {
    // Skip if not running on a physical device (e.g., simulator)
    const isDevice = await Device.isDevice;
    if (!isDevice) {
      console.log('[Push Service] Push notifications are not available on simulator');
      return;
    }
    
    // Check if we need to ask for permission (iOS only)
    if (Platform.OS === 'ios') {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        console.log('[Push Service] Requesting notification permission');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      // Exit if permission was not granted
      if (finalStatus !== 'granted') {
        console.log('[Push Service] Notification permission not granted');
        return;
      }
    }
    
    // Get the Expo push token
    try {
      console.log('[Push Service] Getting Expo push token');
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.projectId,
      });
      const pushToken = tokenData.data;
      console.log('[Push Service] Expo push token:', pushToken);
      
      // Register the token with our backend
      await registerPushTokenWithBackend(pushToken, Platform.OS, getToken);
      
      return pushToken;
    } catch (error) {
      console.error('[Push Service] Error getting push token:', error);
      throw error;
    }
  }, [getToken]);
}

/**
 * Register the push token with the backend
 */
async function registerPushTokenWithBackend(
  token: string,
  deviceOS: string,
  getTokenFn: () => Promise<string | null>
) {
  try {
    console.log('[Push Service] Registering push token with backend');
    const api = createAuthenticatedApi(getTokenFn);
    
    const response = await api.post('/api/push/register', {
      token,
      deviceOS,
    });
    
    console.log('[Push Service] Push token registered successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('[Push Service] Failed to register push token with backend:', error);
    throw error;
  }
}