import { useMemo } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import axios from 'axios';
import { createApiService } from '../services/api';

// API base URL from environment variable
// const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export const useApi = () => {
  const { getToken } = useAuth();
  
  const api = useMemo(() => {
    // Determine the correct Base URL
    const localApiUrl = 'http://localhost:3001'; // Local backend - removed /api suffix
    const productionApiUrl = process.env.EXPO_PUBLIC_API_URL; // From env vars
    
    // Use __DEV__ global provided by Expo to check environment
    const resolvedBaseUrl = __DEV__ ? localApiUrl : productionApiUrl;
    
    console.log(`[useApi] Using API Base URL: ${resolvedBaseUrl}`); // Add logging for verification
    
    if (!__DEV__ && !productionApiUrl) {
      console.warn('[useApi] Production environment detected, but EXPO_PUBLIC_API_URL is not set!');
    }
    
    // Create a new axios instance
    const axiosInstance = axios.create({
      baseURL: resolvedBaseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
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
    
    // Create and return the API service
    return createApiService(axiosInstance);
  }, [getToken]);
  
  return api;
}; 