import axios from 'axios';
import { useAuth } from '@clerk/clerk-expo';

// API base URL from environment variable
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

// Create an axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to create a configured API instance with authentication
export const createAuthenticatedApi = () => {
  const { getToken } = useAuth();
  
  // Add an interceptor to add auth token to requests
  api.interceptors.request.use(async (config) => {
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
  
  return api;
};

// API endpoints factory
export const createApiService = (authenticatedApi: any) => ({
  chat: {
    // Send a message to the AI and get a response
    sendMessage: async (message: string, overridePromptId?: string, requestDebugInfo = false) => {
      try {
        const response = await authenticatedApi.post('/api/chat', {
          message,
          overridePromptId,
          requestDebugInfo,
        });
        return response.data;
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    },
  },
  
  admin: {
    // Get all system prompts
    getSystemPrompts: async () => {
      try {
        const response = await authenticatedApi.get('/admin/system-prompts');
        return response.data;
      } catch (error) {
        console.error('Error getting system prompts:', error);
        throw error;
      }
    },
    
    // Create a new system prompt
    createSystemPrompt: async (name: string, promptText: string) => {
      try {
        const response = await authenticatedApi.post('/admin/system-prompts', {
          name,
          promptText,
        });
        return response.data;
      } catch (error) {
        console.error('Error creating system prompt:', error);
        throw error;
      }
    },
    
    // Update an existing system prompt
    updateSystemPrompt: async (id: string, data: { name?: string; promptText?: string }) => {
      try {
        const response = await authenticatedApi.put(`/admin/system-prompts/${id}`, data);
        return response.data;
      } catch (error) {
        console.error('Error updating system prompt:', error);
        throw error;
      }
    },
    
    // Set a system prompt as active
    setActiveSystemPrompt: async (id: string) => {
      try {
        const response = await authenticatedApi.put(`/admin/system-prompts/${id}/activate`);
        return response.data;
      } catch (error) {
        console.error('Error setting active system prompt:', error);
        throw error;
      }
    },
    
    // Get the list of users
    getUsers: async () => {
      try {
        const response = await authenticatedApi.get('/admin/users');
        return response.data;
      } catch (error) {
        console.error('Error getting users:', error);
        throw error;
      }
    },
    
    // Get a user's conversation history
    getUserHistory: async (userId: string) => {
      try {
        const response = await authenticatedApi.get('/admin/history', {
          params: { userId },
        });
        return response.data;
      } catch (error) {
        console.error('Error getting user history:', error);
        throw error;
      }
    },
    
    // Get a user's structured summary
    getUserSummary: async (userId: string) => {
      try {
        const response = await authenticatedApi.get('/admin/summary', {
          params: { userId },
        });
        return response.data;
      } catch (error) {
        console.error('Error getting user summary:', error);
        throw error;
      }
    },
  }
});

export default api; 