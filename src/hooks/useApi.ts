import { useMemo } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import axios from 'axios';
import { createApiService } from '../services/api';

// API base URL from environment variable
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export const useApi = () => {
  const { getToken } = useAuth();
  
  const api = useMemo(() => {
    // Create a new axios instance
    const axiosInstance = axios.create({
      baseURL: BASE_URL,
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