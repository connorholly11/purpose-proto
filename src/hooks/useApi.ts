import { useMemo } from 'react';
import { useAuth } from '@clerk/nextjs';
import axios from 'axios';
import { createApiService } from '../services/api';

// API base URL from environment variable
// const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const useApi = () => {
  const { getToken } = useAuth();
  
  const api = useMemo(() => {
    // Determine the correct Base URL
    const localApiUrl = 'http://localhost:3001'; // Local backend - removed /api suffix
    const productionApiUrl = process.env.NEXT_PUBLIC_API_URL; // From env vars
    
    // Check environment for development mode
    const isDev = process.env.NODE_ENV === 'development';
    const resolvedBaseUrl = isDev ? localApiUrl : productionApiUrl;
    
    // Remove trailing slash if present to prevent double-slash issues
    const normalizedBaseUrl = resolvedBaseUrl?.endsWith('/') 
      ? resolvedBaseUrl.slice(0, -1) 
      : resolvedBaseUrl;
    
    if (!isDev && !productionApiUrl) {
      console.warn('[useApi] Production environment detected, but NEXT_PUBLIC_API_URL is not set!');
    }
    
    // Create a new axios instance with timeout
    const axiosInstance = axios.create({
      baseURL: normalizedBaseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout for LLM requests
    });
    
    // Add auth token to requests
    axiosInstance.interceptors.request.use(async (config) => {
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
    
    // Add global error handler for network errors
    axiosInstance.interceptors.response.use(
      response => response,
      error => {
        if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
          console.log('[API] Network connection issue detected');
        }
        return Promise.reject(error);
      }
    );
    
    // Create and return the API service
    return createApiService(axiosInstance);
  }, [getToken]);
  
  return api;
}; 