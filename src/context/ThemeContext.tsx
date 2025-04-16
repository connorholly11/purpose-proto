import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MD3LightTheme, MD3Theme } from 'react-native-paper';
import { ThemeKey, themeOptions } from '../theme/colors';

// Theme context type
type ThemeContextType = {
  colorTheme: ThemeKey;
  setColorTheme: (theme: ThemeKey) => void;
  paperTheme: MD3Theme;
};

// Create modified theme based on selected color
const getThemeForColor = (themeKey: ThemeKey): MD3Theme => {
  const baseColor = themeOptions[themeKey].color;
  
  return {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      primary: baseColor,
      primaryContainer: themeOptions[themeKey].color + '20', // 20% opacity
      secondary: themeOptions[themeKey].color,
      error: themeKey === 'red' ? '#991b1b' : '#dc2626',
      background: '#FFFFFF',
    },
  };
};

// Create context with default value
const ThemeContext = createContext<ThemeContextType>({
  colorTheme: 'blue',
  setColorTheme: () => {},
  paperTheme: getThemeForColor('blue'),
});

// Theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colorTheme, setColorTheme] = useState<ThemeKey>('blue');
  const [paperTheme, setPaperTheme] = useState<MD3Theme>(getThemeForColor('blue'));
  
  // Load saved theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('userTheme');
        if (savedTheme && isValidThemeKey(savedTheme)) {
          const themeKey = savedTheme as ThemeKey;
          setColorTheme(themeKey);
          setPaperTheme(getThemeForColor(themeKey));
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    
    loadTheme();
  }, []);
  
  // Save theme when it changes
  const handleSetColorTheme = async (newTheme: ThemeKey) => {
    try {
      // Update state
      setColorTheme(newTheme);
      setPaperTheme(getThemeForColor(newTheme));
      
      // Save to storage
      await AsyncStorage.setItem('userTheme', newTheme);
      
      // Apply theme class to html element in web
      if (Platform.OS === 'web') {
        // Remove all theme classes
        document.documentElement.classList.remove(
          'theme-blue', 'theme-purple', 'theme-red', 
          'theme-green', 'theme-yellow', 'theme-teal', 'theme-pink'
        );
        
        // Add new theme class
        document.documentElement.classList.add(`theme-${newTheme}`);
        
        // Update CSS variables for web
        const root = document.documentElement;
        root.style.setProperty('--primary-color', themeOptions[newTheme].color);
        root.style.setProperty('--primary-gradient', themeOptions[newTheme].gradient);
      }
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };
  
  return (
    <ThemeContext.Provider value={{ colorTheme, setColorTheme: handleSetColorTheme, paperTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Helper to validate theme keys
function isValidThemeKey(key: string): key is ThemeKey {
  return ['blue', 'purple', 'red', 'green', 'yellow', 'teal', 'pink'].includes(key);
}

// Hook for using theme
export const useTheme = () => useContext(ThemeContext);