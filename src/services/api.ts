import axios from 'axios';
import { useAuth } from '@clerk/clerk-expo';
import { Platform } from 'react-native';

// API base URL
const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'http://localhost:3001';

// Create an axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to create a configured API instance with authentication (hook version)
export const useAuthenticatedApi = () => {
  const { getToken } = useAuth();
  
  // Clone the api instance to avoid modifying the original
  const authenticatedApi = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  // Add an interceptor to add auth token to requests
  authenticatedApi.interceptors.request.use(async (config) => {
    try {
      const token = await getToken();
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    } catch (error) {
      console.error('Error setting auth token:', error);
      return config;
    }
  });
  
  return authenticatedApi;
};

// Non-hook version that accepts a token getter function
export const createAuthenticatedApi = (getTokenFn: () => Promise<string | null>) => {
  // Clone the api instance to avoid modifying the original
  const authenticatedApi = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  // Add an interceptor to add auth token to requests
  authenticatedApi.interceptors.request.use(async (config) => {
    try {
      const token = await getTokenFn();
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    } catch (error) {
      console.error('Error setting auth token:', error);
      return config;
    }
  });
  
  return authenticatedApi;
};

// API endpoints factory
export const createApiService = (authenticatedApi: any) => ({
  chat: {
    // Send a message to the AI and get a response
    sendMessage: async (message: string, overridePromptId?: string, requestDebugInfo = false, useContext = true, conversationId?: string | null) => {
      try {
        console.log('===== AI COMPANION API CALL START =====');
        console.log(`Request details:
- Message length: ${message.length} chars
- First few words: "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"
- Override prompt ID: ${overridePromptId || 'None'}
- Request debug info: ${requestDebugInfo}
- Use context: ${useContext}
- Conversation ID: ${conversationId || 'New conversation'}`);
        
        const startTime = Date.now();
        const response = await authenticatedApi.post('/api/chat', {
          message,
          overridePromptId,
          requestDebugInfo,
          useContext,
          conversationId, // Pass conversationId to backend
        });
        const requestTime = Date.now() - startTime;
        
        console.log(`Response received in ${requestTime}ms:
- Status: ${response.status}
- Response type: ${typeof response.data}
- Reply length: ${response.data.reply?.length || 0} chars
- Conversation ID: ${response.data.conversationId}
- Is new conversation: ${response.data.isNewConversation}
- Debug info included: ${Boolean(response.data.debugInfo)}`);
        console.log('===== AI COMPANION API CALL COMPLETE =====');
        
        return response.data;
      } catch (error) {
        console.error('===== AI COMPANION API CALL ERROR =====');
        console.error('Error sending message:', error);
        if (axios.isAxiosError(error)) {
          console.error(`Status: ${error.response?.status}`);
          console.error(`Response data:`, error.response?.data);
        }
        console.error('===== AI COMPANION API CALL ERROR END =====');
        throw error;
      }
    },
  },
  
  feedback: {
    // Submit new feedback
    submitFeedback: async (category: string, content: string) => {
      try {
        const response = await authenticatedApi.post('/api/feedback', {
          category,
          content,
        });
        return response.data;
      } catch (error) {
        console.error('Error submitting feedback:', error);
        throw error;
      }
    },
  },
  

  // Email-related API endpoints
  email: {
    // Send AI-generated email
    sendEmail: async (userId: string, email?: string) => {
      try {
        const response = await authenticatedApi.post('/api/email/send', {
          userId,
          email, // Include the override email if provided
        });
        return response.data;
      } catch (error) {
        console.error('Error sending email:', error);
        throw error;
      }
    },

    // Get email logs for a specific user
    getUserEmailLogs: async (userId: string) => {
      try {
        const response = await authenticatedApi.get(`/api/email/logs/${userId}`);
        return response.data;
      } catch (error) {
        console.error('Error getting user email logs:', error);
        throw error;
      }
    },
  }
});

export default api;