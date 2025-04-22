import { useCallback, useState } from 'react';
import { useAuthenticatedApi } from '../services/api';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

/**
 * Hook for testing push notifications
 * @returns Object with sendTest function, loading state, and error state
 */
export const useTestPush = () => {
  const api = useAuthenticatedApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<any>(null);

  // Function to check notification permissions and token
  const checkPermissionsAndToken = useCallback(async () => {
    console.log('[PUSH TEST] Checking notification permissions and token');
    
    try {
      // Check permissions
      const { status } = await Notifications.getPermissionsAsync();
      console.log(`[PUSH TEST] Current permission status: ${status}`);
      
      if (status !== 'granted') {
        console.log('[PUSH TEST] Permissions not granted');
        return {
          permissionsGranted: false,
          token: null
        };
      }
      
      // Try to get token
      try {
        console.log('[PUSH TEST] Getting push token');
        console.log(`[PUSH TEST] Project ID: ${Constants.expoConfig?.extra?.eas?.projectId}`);
        
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId
        });
        
        console.log(`[PUSH TEST] Got token: ${tokenData.data}`);
        
        return {
          permissionsGranted: true,
          token: tokenData.data
        };
      } catch (tokenError) {
        console.error('[PUSH TEST] Error getting token:', tokenError);
        return {
          permissionsGranted: true,
          token: null,
          tokenError: tokenError.message
        };
      }
    } catch (e) {
      console.error('[PUSH TEST] Error checking permissions:', e);
      return {
        error: e.message
      };
    }
  }, []);

  const sendTest = useCallback(async (delaySec = 60) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      setTokenInfo(null);
      
      console.log(`[PUSH TEST] Starting push test with ${delaySec}s delay`);
      
      // First check permissions and token
      const tokenStatus = await checkPermissionsAndToken();
      setTokenInfo(tokenStatus);
      
      console.log('[PUSH TEST] Token status:', tokenStatus);
      
      // Print token for direct CLI testing
      if (tokenStatus.token) {
        console.log('\n[PUSH TEST] To test with Expo CLI, run:');
        console.log(`npx expo push:send --to ${tokenStatus.token} --title "Expo CLI ping" --body "If you see me, the backend is innocent"\n`);
      }
      
      if (!tokenStatus.permissionsGranted) {
        setError('Push notifications permission not granted. Please enable notifications in your device settings.');
        return;
      }
      
      if (!tokenStatus.token) {
        setError(`Unable to get push token: ${tokenStatus.tokenError || 'Unknown error'}`);
        return;
      }
      
      // Verify the token format before sending
      if (!tokenStatus.token.startsWith('ExponentPushToken[') && !tokenStatus.token.startsWith('ExpoPushToken[')) {
        console.error(`[PUSH TEST] Invalid token format: ${tokenStatus.token}`);
        setError('Invalid push token format. Token must start with ExponentPushToken[ or ExpoPushToken[');
        return;
      }
      
      // Enhanced logging of the token we're using to test
      console.log(`[PUSH TEST] Token verification - using token: ${tokenStatus.token}`);
      console.log('[PUSH TEST] Token characteristics:', {
        length: tokenStatus.token.length,
        format: tokenStatus.token.includes('ExponentPushToken') ? 'Expo Format' : 'Unknown Format',
        containsBrackets: tokenStatus.token.includes('[') && tokenStatus.token.includes(']'),
      });
      
      // Send test request to API
      console.log('[PUSH TEST] Sending test request to API');
      const response = await api.post('/api/push/test', { 
        delaySec,
        // Include debugging info in the test request
        debug: {
          timestamp: new Date().toISOString(),
          deviceInfo: {
            platform: Platform.OS,
            version: Platform.Version,
            isSimulator: __DEV__ ? 'Possibly' : 'No'
          }
        }
      });
      console.log('[PUSH TEST] API response:', response.data);
      
      // If we got a ticket ID, display instructions for checking receipts
      if (response.data?.ticketId) {
        console.log(`[PUSH TEST] To check push receipt status, run:\nnpx expo push:receipts ${response.data.ticketId}`);
      }
      
      // Update token info with server response
      setTokenInfo({
        ...tokenStatus,
        serverResponse: response.data
      });
      
      setSuccess(true);
    } catch (e: any) {
      console.error('[PUSH TEST] Error:', e);
      
      // Capture detailed error info
      const errorDetails = {
        message: e?.message || 'Unknown error',
        response: e?.response ? {
          status: e.response.status,
          data: e.response.data
        } : 'No response data',
        serverMessage: e?.response?.data?.error || 'No server error message'
      };
      
      console.log('[PUSH TEST] Error details:', errorDetails);
      
      // Enhanced error message with debugging instructions
      let errorMessage = e?.response?.data?.error || e?.message || 'Failed to send test notification';
      
      // Add more context based on specific error conditions
      if (e?.response?.data?.tokens === 0) {
        errorMessage = 'No push tokens registered for your device. Please restart the app and try again.';
      } else if (e?.message?.includes('Network Error')) {
        errorMessage = 'Network error connecting to server. Check your internet connection.';
      }
      
      setError(errorMessage);
      setTokenInfo({
        ...tokenInfo,
        error: errorDetails,
        troubleshootingSteps: [
          'Check notification permissions in device settings',
          'Verify you\'re using an EAS build, not Expo Go or simulator',
          'Restart the app to regenerate token',
          'Check server logs for detailed error messages'
        ]
      });
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  }, [api, checkPermissionsAndToken]);

  return { 
    sendTest, 
    loading, 
    error,
    success,
    tokenInfo
  };
};

export default useTestPush;