import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const HAPTICS_ENABLED_KEY = 'userHaptics';

// Define the context type
type HapticsContextType = {
  hapticsEnabled: boolean;
  setHapticsEnabled: (enabled: boolean) => void;
  trigger: (type?: Haptics.ImpactFeedbackStyle | Haptics.NotificationFeedbackType) => void;
};

// Default context value
const defaultHapticsContext: HapticsContextType = {
  hapticsEnabled: true, // Default to enabled
  setHapticsEnabled: () => {},
  trigger: () => {},
};

// Create the context
const HapticsContext = createContext<HapticsContextType>(defaultHapticsContext);

// Haptics provider component
export const HapticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hapticsEnabled, setHapticsEnabledState] = useState<boolean>(true);

  // Load saved haptics preference on mount
  useEffect(() => {
    const loadHapticsSetting = async () => {
      try {
        const savedValue = await AsyncStorage.getItem(HAPTICS_ENABLED_KEY);
        // Default to true if not set or if value is '1'
        setHapticsEnabledState(savedValue === null || savedValue === 'true');
      } catch (error) {
        console.error('Error loading haptics setting:', error);
      }
    };
    loadHapticsSetting();
  }, []);

  // Save preference when it changes
  const handleSetHapticsEnabled = async (enabled: boolean) => {
    try {
      setHapticsEnabledState(enabled);
      await AsyncStorage.setItem(HAPTICS_ENABLED_KEY, String(enabled));
      // Trigger a light impact when toggling
      if (enabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Error saving haptics setting:', error);
    }
  };

  // Haptic trigger function - only triggers if enabled
  const trigger = useCallback((type: Haptics.ImpactFeedbackStyle | Haptics.NotificationFeedbackType = Haptics.ImpactFeedbackStyle.Light) => {
    if (hapticsEnabled) {
      if (Object.values(Haptics.ImpactFeedbackStyle).includes(type as Haptics.ImpactFeedbackStyle)) {
        Haptics.impactAsync(type as Haptics.ImpactFeedbackStyle);
      } else if (Object.values(Haptics.NotificationFeedbackType).includes(type as Haptics.NotificationFeedbackType)) {
        Haptics.notificationAsync(type as Haptics.NotificationFeedbackType);
      } else {
        // Default to light impact if type is somehow invalid
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [hapticsEnabled]);

  return (
    <HapticsContext.Provider value={{ hapticsEnabled, setHapticsEnabled: handleSetHapticsEnabled, trigger }}>
      {children}
    </HapticsContext.Provider>
  );
};

// Hook for using haptics context
export const useHaptics = () => useContext(HapticsContext); 