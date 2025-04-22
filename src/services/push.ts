import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useAuthenticatedApi } from './api';
import { useAuth } from '@clerk/clerk-expo';

/**
 * Hook to register for push notifications
 * Must be called from a React component
 */
export function useRegisterForPush() {
  const api = useAuthenticatedApi();
  const { getToken } = useAuth();
  
  const register = async () => {
    await registerForPushWithToken(() => getToken(), api);
  };
  
  return register;
}

/**
 * Requests push notification permissions and registers the device token with the server
 * @param getTokenFn - Function to get the auth token
 * @param authApi - Authenticated API instance
 * @returns Promise<void>
 */
export async function registerForPushWithToken(
  getTokenFn: () => Promise<string | null>,
  authApi: any
) {
  try {
    console.log('[PUSH DEBUG] Starting push notification registration process');
    
    // Skip availability check as it's not available in this version of expo-notifications
    console.log('[PUSH DEBUG] Assuming push notifications are available on this device');
    console.log(`[PUSH DEBUG] Device platform: ${Platform.OS}`);
    
    // If we're on iOS simulator, log a warning as push doesn't work on simulator
    if (Platform.OS === 'ios' && !__DEV__) {
      console.log('[PUSH DEBUG] Running on iOS simulator - push notifications will never work here');
    }
    
    // Request permission to receive push notifications
    console.log('[PUSH DEBUG] Requesting push notification permissions');
    const { status } = await Notifications.requestPermissionsAsync();
    console.log(`[PUSH DEBUG] Push notification permission status: ${status}`);
    
    if (status !== 'granted') {
      console.log('[PUSH DEBUG] Push notification permission not granted. Aborting registration.');
      return;
    }
    
    console.log('[PUSH DEBUG] Getting Expo push token');
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    console.log(`[PUSH DEBUG] Using project ID: ${projectId}`);
    
    // Validate project ID
    if (!projectId) {
      console.error('[PUSH DEBUG] Missing project ID - this is required for push notifications');
      throw new Error('Missing project ID');
    }
    
    // Get the Expo push token
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId
      });
      
      const token = tokenData.data;
      console.log(`[PUSH DEBUG] Received Expo push token: ${token}`);
      
      // Verify the token format
      if (!token || !token.startsWith('ExponentPushToken[') && !token.startsWith('ExpoPushToken[')) {
        console.error(`[PUSH DEBUG] Invalid token format: ${token}`);
        throw new Error('Invalid token format');
      }
      
      // Log device details for debugging
      console.log('[PUSH DEBUG] Device details:', {
        platform: Platform.OS,
        version: Platform.Version,
        manufacturer: Platform.OS === 'android' ? 'Android Manufacturer' : 'Apple',
        isSimulator: __DEV__ ? 'Possibly' : 'No'
      });
      
      // Send the token to our backend
      console.log('[PUSH DEBUG] Sending token to backend');
      const response = await authApi.post('/api/push/register', { 
        token, 
        deviceOS: Platform.OS
      });
      
      console.log('[PUSH DEBUG] Push notification token registered successfully');
      console.log(`[PUSH DEBUG] Server response: ${JSON.stringify(response.data)}`);
      
      // For testing: print out the token for manual verification
      console.log('=== device token ===', token);
      
      return token;
    } catch (tokenError) {
      console.error('[PUSH DEBUG] Error getting or registering push token:', tokenError);
      
      // Additional debugging for token errors
      console.log('[PUSH DEBUG] Token error details:', {
        message: tokenError.message,
        stack: tokenError.stack,
        networkError: tokenError.response ? {
          status: tokenError.response.status,
          data: tokenError.response.data
        } : 'No network response'
      });
      
      throw tokenError;
    }
  } catch (error) {
    console.error('[PUSH DEBUG] Unexpected error in registerForPushWithToken:', error);
    throw error;
  }
}

/**
 * Sets up notification handlers for the app
 */
export function setupNotifications() {
  console.log('[PUSH DEBUG] Setting up notification handlers');
  
  // Configure how notifications are handled when app is in foreground
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      console.log('[PUSH DEBUG] Handling foreground notification:', notification);
      return {
        shouldShowAlert: true,  // This controls whether alerts are shown when app is in foreground
        shouldPlaySound: true,  // This controls whether sounds are played when notifications are received
        shouldSetBadge: false,  // This controls whether a badge appears on the app icon
      };
    },
  });
  
  // Handle notification received while app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('[PUSH DEBUG] Notification received in foreground:', {
      title: notification.request.content.title,
      body: notification.request.content.body,
      data: notification.request.content.data,
    });
  });
  
  // Handle notification opened while app in background/killed state
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('[PUSH DEBUG] User tapped on notification:', {
      title: response.notification.request.content.title,
      body: response.notification.request.content.body,
      data: response.notification.request.content.data,
    });
    
    // The navigation logic would ideally be handled by the component that imports this
  });
  
  // Log current notification settings
  Notifications.getPermissionsAsync().then(({ status }) => {
    console.log(`[PUSH DEBUG] Current notification permission status: ${status}`);
  });
  
  // Log current status
  console.log('[PUSH DEBUG] Notification handlers set up');
  
  return {
    cleanup: () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
      console.log('[PUSH DEBUG] Notification listeners cleaned up');
    }
  };
}