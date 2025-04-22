import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuthContext } from './AuthContext';

// Type for the system prompt
export type SystemPrompt = {
  id: string;
  name: string;
  promptText: string;
  isActive: boolean;
  isFavorite: boolean;
  modelName?: string;
  createdAt: string;
  updatedAt: string;
};

// Context type definition
type SystemPromptContextType = {
  prompts: SystemPrompt[];
  activePrompt: SystemPrompt | null;
  loadingPrompts: boolean;
  error: string | null;
  loadPrompts: () => Promise<void>;
  activatePrompt: (id: string) => Promise<void>;
  createPrompt: (name: string, promptText: string, modelName: string, isFavorite?: boolean) => Promise<void>;
  updatePrompt: (id: string, data: { name?: string; promptText?: string; modelName?: string; isFavorite?: boolean }) => Promise<void>;
  toggleFavorite: (id: string, current: boolean) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
};

// Create the context with default values
const SystemPromptContext = createContext<SystemPromptContextType>({
  prompts: [],
  activePrompt: null,
  loadingPrompts: false,
  error: null,
  loadPrompts: async () => {},
  activatePrompt: async () => {},
  createPrompt: async () => {},
  updatePrompt: async () => {},
  toggleFavorite: async () => {},
  deletePrompt: async () => {},
});

// Props for the SystemPromptProvider component
type SystemPromptProviderProps = {
  children: ReactNode;
};

// SystemPromptProvider component
export const SystemPromptProvider = ({ children }: SystemPromptProviderProps) => {
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [activePrompt, setActivePrompt] = useState<SystemPrompt | null>(null);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const api = useApi();
  const { userId, isLoaded } = useAuthContext();
  
  // Load system prompts from the backend
  const loadPrompts = async () => {
    try {
      setLoadingPrompts(true);
      setError(null);
      
      // Fetch all available prompts with a timeout
      let fetchedPrompts;
      try {
        fetchedPrompts = await api.admin.getSystemPrompts();
      } catch (err) {
        console.log('Backend connection issue, using empty prompts list');
        // Use empty array if we can't connect
        fetchedPrompts = [];
        // Rethrow to skip the rest of the function
        throw err;
      }
      setPrompts(fetchedPrompts);
      
      // If we have a userId, get the user-specific active prompt
      if (userId) {
        try {
          const userActivePrompt = await api.admin.getUserActiveSystemPrompt(userId);
          setActivePrompt(userActivePrompt);
        } catch (err) {
          console.error('Failed to load user-specific active prompt, falling back to global default');
          
          // If user doesn't have a specific prompt, find the global default
          const globalDefault = fetchedPrompts.find((p: SystemPrompt) => p.isActive);
          setActivePrompt(globalDefault || null);
        }
      } else {
        // No user ID, just use the global default
        const globalDefault = fetchedPrompts.find((p: SystemPrompt) => p.isActive);
        setActivePrompt(globalDefault || null);
      }
    } catch (err) {
      console.error('Failed to load system prompts:', err);
      setError('Failed to load prompts');
    } finally {
      setLoadingPrompts(false);
    }
  };
  
  // Load prompts when user authentication is loaded or userId changes
  useEffect(() => {
    if (isLoaded) {
      loadPrompts().catch(error => {
        // Silence network errors to avoid console clutter when backend is not available
        if (error?.message === 'Network Error') {
          console.log('Backend not available, system prompts will not be loaded');
        } else {
          console.error('Error loading system prompts:', error);
        }
      });
    }
  }, [isLoaded, userId]);
  
  // Activate a prompt for the current user
  const activatePrompt = async (id: string) => {
    try {
      setLoadingPrompts(true);
      setError(null);
      
      if (userId) {
        // Set the prompt as active for this specific user
        await api.admin.setUserActiveSystemPrompt(userId, id);
      } else {
        // Fall back to global activation if no user ID
        await api.admin.setActiveSystemPrompt(id);
      }
      
      // Update the local state by finding the activated prompt
      const activatedPrompt = prompts.find(p => p.id === id);
      if (activatedPrompt) {
        setActivePrompt(activatedPrompt);
      }
      
      // Also update the isActive property in the prompts array for UI display
      const updatedPrompts = prompts.map(prompt => ({
        ...prompt,
        isActive: prompt.id === id
      }));
      
      setPrompts(updatedPrompts);
    } catch (err) {
      console.error('Failed to activate prompt:', err);
      setError('Failed to activate prompt');
    } finally {
      setLoadingPrompts(false);
    }
  };
  
  // Create a new prompt
  const createPrompt = async (name: string, promptText: string, modelName: string, isFavorite?: boolean) => {
    try {
      setLoadingPrompts(true);
      setError(null);
      await api.admin.createSystemPrompt(name, promptText, modelName, isFavorite);
      await loadPrompts(); // Reload all prompts to get the new one
    } catch (err) {
      console.error('Failed to create prompt:', err);
      setError('Failed to create prompt');
    } finally {
      setLoadingPrompts(false);
    }
  };
  
  // Update an existing prompt
  const updatePrompt = async (id: string, data: { name?: string; promptText?: string; modelName?: string; isFavorite?: boolean }) => {
    try {
      setLoadingPrompts(true);
      setError(null);
      await api.admin.updateSystemPrompt(id, data);
      await loadPrompts(); // Reload all prompts to get the updated one
    } catch (err) {
      console.error('Failed to update prompt:', err);
      setError('Failed to update prompt');
    } finally {
      setLoadingPrompts(false);
    }
  };

  // Toggle favorite status for a prompt
  const toggleFavorite = async (id: string, current: boolean) => {
    try {
      await updatePrompt(id, { isFavorite: !current });
    } catch (err) {
      console.error('Failed to toggle favorite status:', err);
      setError('Failed to toggle favorite status');
    }
  };
  
  // Delete a prompt
  const deletePrompt = async (id: string) => {
    try {
      setLoadingPrompts(true);
      setError(null);
      await api.admin.deleteSystemPrompt(id);
      await loadPrompts(); // Reload all prompts after deletion
    } catch (err) {
      console.error('Failed to delete prompt:', err);
      setError('Failed to delete prompt');
    } finally {
      setLoadingPrompts(false);
    }
  };
  
  // Context value
  const value = {
    prompts,
    activePrompt,
    loadingPrompts,
    error,
    loadPrompts,
    activatePrompt,
    createPrompt,
    updatePrompt,
    toggleFavorite,
    deletePrompt,
  };
  
  return <SystemPromptContext.Provider value={value}>{children}</SystemPromptContext.Provider>;
};

// Custom hook to use the system prompt context
export const useSystemPrompts = () => useContext(SystemPromptContext); 