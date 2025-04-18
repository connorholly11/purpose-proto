import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

// Optional hook to manage admin mode state
export const useAdminToggle = (initialState: boolean = false) => {
  const [useUserContext, setUseUserContext] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(initialState);
  
  // Handle context toggle
  const handleContextToggle = (value: boolean) => {
    setUseUserContext(value);
  };

  // Toggle admin mode
  const toggleAdminMode = () => {
    setIsAdminMode(!isAdminMode);
  };

  return {
    useUserContext,
    isAdminMode,
    handleContextToggle,
    toggleAdminMode,
    setIsAdminMode,
    // Helper for platform detection
    isIOS: Platform.OS === 'ios',
    isWeb: Platform.OS === 'web'
  };
};

export default useAdminToggle;