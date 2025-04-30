import axios from 'axios';
import { useAuth } from '@clerk/nextjs';

// API base URL from environment variable
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
  
  admin: {
    // Get all system prompts
    getSystemPrompts: async () => {
      try {
        const response = await authenticatedApi.get('/api/admin/system-prompts');
        return response.data;
      } catch (error) {
        console.error('Error getting system prompts:', error);
        throw error;
      }
    },
    
    // Create a new system prompt
    createSystemPrompt: async (name: string, promptText: string, modelName: string) => {
      try {
        const response = await authenticatedApi.post('/api/admin/system-prompts', {
          name,
          promptText,
          modelName,
        });
        return response.data;
      } catch (error) {
        console.error('Error creating system prompt:', error);
        throw error;
      }
    },
    
    // Update an existing system prompt
    updateSystemPrompt: async (id: string, data: { name?: string; promptText?: string; modelName?: string }) => {
      try {
        const response = await authenticatedApi.put(`/api/admin/system-prompts/${id}`, data);
        return response.data;
      } catch (error) {
        console.error('Error updating system prompt:', error);
        throw error;
      }
    },
    
    // Delete a system prompt
    deleteSystemPrompt: async (id: string) => {
      try {
        const response = await authenticatedApi.delete(`/api/admin/system-prompts/${id}`);
        return response.data;
      } catch (error) {
        console.error('Error deleting system prompt:', error);
        throw error;
      }
    },
    
    // Set a system prompt as the global active prompt
    setActiveSystemPrompt: async (id: string) => {
      try {
        const response = await authenticatedApi.put(`/api/admin/system-prompts/${id}/activate`);
        return response.data;
      } catch (error) {
        console.error('Error setting active system prompt:', error);
        throw error;
      }
    },
    
    // Set a system prompt as active for a specific user
    setUserActiveSystemPrompt: async (userId: string, promptId: string) => {
      try {
        const response = await authenticatedApi.put(`/api/admin/system-prompts/${promptId}/activate`, {
          userId,
        });
        return response.data;
      } catch (error) {
        console.error(`Error setting active system prompt for user ${userId}:`, error);
        throw error;
      }
    },
    
    // Get the active system prompt for a specific user
    getUserActiveSystemPrompt: async (userId: string) => {
      try {
        const response = await authenticatedApi.get(`/api/admin/system-prompts/user/${userId}/active`);
        return response.data;
      } catch (error) {
        console.error(`Error getting active system prompt for user ${userId}:`, error);
        throw error;
      }
    },
    
    // Get the list of users
    getUsers: async () => {
      try {
        const response = await authenticatedApi.get('/api/admin/users');
        return response.data;
      } catch (error) {
        console.error('Error getting users:', error);
        throw error;
      }
    },
    
    // Get a user's conversation history
    getUserHistory: async (userId: string) => {
      try {
        const response = await authenticatedApi.get('/api/admin/history', {
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
        const response = await authenticatedApi.get('/api/admin/summary', {
          params: { userId },
        });
        return response.data;
      } catch (error) {
        // Check if it's an Axios error and the status is 404
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          // Log a warning for debugging, but don't treat as a fatal error
          console.warn(`Structured summary not found for user ${userId} (404). Returning null.`);
          return null; // Return null to indicate the summary doesn't exist
        } else {
          // For any other error (500, network issues, etc.), log and re-throw
          console.error('Error getting user summary:', error);
          throw error; 
        }
      }
    },
    
    // Generate/update a summary for a user
    generateUserSummary: async (userId: string) => {
      try {
        const response = await authenticatedApi.post('/api/admin/generate-summary', {
          userId,
          trigger: 'manual',
        });
        return response.data;
      } catch (error) {
        console.error('Error generating user summary:', error);
        throw error;
      }
    },
    
    // Get summarization logs
    getSummarizationLogs: async (filters?: { userId?: string; status?: string }) => {
      try {
        const response = await authenticatedApi.get('/api/admin/summarization-logs', {
          params: filters
        });
        return response.data;
      } catch (error) {
        console.error('Error getting summarization logs:', error);
        throw error;
      }
    },
    
    // Get all feedback submissions
    getFeedback: async (filters?: { category?: string; status?: string }) => {
      try {
        const response = await authenticatedApi.get('/api/admin/feedback', {
          params: filters
        });
        return response.data;
      } catch (error) {
        console.error('Error getting feedback:', error);
        throw error;
      }
    },
    
    // Update feedback status
    updateFeedbackStatus: async (id: string, status: 'new' | 'reviewed' | 'resolved') => {
      try {
        const response = await authenticatedApi.put(`/api/admin/feedback/${id}`, {
          status,
        });
        return response.data;
      } catch (error) {
        console.error('Error updating feedback status:', error);
        throw error;
      }
    },
    
    // Update feedback content
    updateFeedbackContent: async (id: string, content: string) => {
      try {
        const response = await authenticatedApi.put(`/api/admin/feedback/${id}/content`, {
          content,
        });
        return response.data;
      } catch (error) {
        console.error('Error updating feedback content:', error);
        throw error;
      }
    },

    // Send AI-generated email to user
    sendAiEmail: async (userId: string, email?: string) => {
      try {
        const response = await authenticatedApi.post('/api/admin/send-ai-email', {
          userId,
          email, // Include the override email if provided
        });
        return response.data;
      } catch (error) {
        console.error('Error sending AI email:', error);
        throw error;
      }
    },

    // Get email logs for all users (admin)
    getEmailLogs: async () => {
      try {
        const response = await authenticatedApi.get('/api/admin/email-logs');
        return response.data;
      } catch (error) {
        console.error('Error getting email logs:', error);
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