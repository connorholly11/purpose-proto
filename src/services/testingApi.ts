import axios from 'axios';
import { useAuth } from '@clerk/clerk-expo';

// Define the progress callback type
type ProgressCallback = (completedCalls: number) => void;

// A separate hook or service dedicated to Testing
export function useTestingApi() {
  const { getToken } = useAuth();

  // Create an axios instance for /api/testing
  // Note the baseURL logic for dev vs production
  const testApi = axios.create({
    baseURL: __DEV__
      ? 'http://localhost:3001/api/testing'
      : (process.env.EXPO_PUBLIC_API_URL || '') + '/api/testing',
  });

  // Attach auth token if available
  testApi.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return {
    // Option 1: Reuse the existing admin route to fetch system prompts
    // Or implement a new getAllPrompts route in testingRoutes if you prefer total separation
    async getAllSystemPrompts() {
      const adminEndpoint = __DEV__
        ? 'http://localhost:3001/api/admin/system-prompts'
        : (process.env.EXPO_PUBLIC_API_URL || '') + '/api/admin/system-prompts';
      const resp = await axios.get(adminEndpoint, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      return resp.data;
    },

    async runSequence(
      promptIds: string[],
      messages: { role: 'user'; content: string }[],
      progressCallback?: ProgressCallback
    ) {
      // Generate a unique test ID for tracking this specific test run
      const testId = `test_${Date.now()}`;
      
      // Start polling for progress updates if callback provided
      let pollInterval: NodeJS.Timeout | null = null;
      
      if (progressCallback) {
        pollInterval = setInterval(async () => {
          try {
            const progressResp = await testApi.get(`/progress/${testId}`);
            const { completed, total } = progressResp.data;
            progressCallback(completed);
            
            // If test is complete, stop polling
            if (completed >= total) {
              if (pollInterval) clearInterval(pollInterval);
            }
          } catch (err) {
            console.error('Error polling progress:', err);
          }
        }, 500); // Poll every 500ms
      }

      try {
        // Include the testId with the request
        const resp = await testApi.post('/run-sequence', { 
          promptIds, 
          messages,
          testId 
        });
        
        // Ensure polling is stopped
        if (pollInterval) clearInterval(pollInterval);
        
        // Call one final time to ensure we have the final state
        if (progressCallback) {
          const totalCalls = promptIds.length * messages.length;
          progressCallback(totalCalls);
        }
        
        return resp.data;
      } catch (err) {
        // Ensure polling is stopped on error too
        if (pollInterval) clearInterval(pollInterval);
        throw err;
      }
    },

    async runProtocol(
      promptIds: string[], 
      protocolType: string,
      progressCallback?: ProgressCallback
    ) {
      // Generate a unique test ID for tracking this specific test run
      const testId = `test_${Date.now()}`;
      
      // Start polling for progress updates if callback provided
      let pollInterval: NodeJS.Timeout | null = null;
      
      if (progressCallback) {
        pollInterval = setInterval(async () => {
          try {
            const progressResp = await testApi.get(`/progress/${testId}`);
            const { completed, total } = progressResp.data;
            progressCallback(completed);
            
            // If test is complete, stop polling
            if (completed >= total) {
              if (pollInterval) clearInterval(pollInterval);
            }
          } catch (err) {
            console.error('Error polling progress:', err);
          }
        }, 500); // Poll every 500ms
      }

      try {
        // Include the testId with the request
        const resp = await testApi.post('/run-protocol', {
          promptIds,
          protocolType,
          testId
        });
        
        // Ensure polling is stopped
        if (pollInterval) clearInterval(pollInterval);
        
        // Call one final time to ensure we have the final state
        if (progressCallback && protocolType === '4x4x4') {
          const totalCalls = promptIds.length * 12; // 12 messages in 4x4x4
          progressCallback(totalCalls);
        }
        
        return resp.data;
      } catch (err) {
        // Ensure polling is stopped on error too
        if (pollInterval) clearInterval(pollInterval);
        throw err;
      }
    },
  };
}
