import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MD3LightTheme, MD3DarkTheme, MD3Theme } from 'react-native-paper';
import { ThemeKey, themeOptions } from '../theme/colors';
import { getThemeForColor } from '../theme/theme';
import tinycolor from 'tinycolor2';

// Storage keys
const THEME_KEY = 'userTheme';
const DARK_MODE_KEY = 'userDarkMode';

// AI primary color palette type
export type AiPrimaryColors = {
  main: string;
  pressed: string;
  textOn: string;
};

// Theme context type
type ThemeContextType = {
  colorTheme: ThemeKey;
  setColorTheme: (theme: ThemeKey) => void;
  darkMode: boolean;
  setDarkMode: (isDark: boolean) => void;
  paperTheme: MD3Theme;
  keyboardAppearance: 'light' | 'dark';
  getAiPrimary: (colorTheme?: ThemeKey, isDark?: boolean) => AiPrimaryColors;
};

// Helper to get AI primary color palette based on theme and dark mode
export const getAiPrimary = (k: ThemeKey, dark: boolean): AiPrimaryColors => {
  const base = themeOptions[k].color;
  return {
    main: base,
    pressed: tinycolor(base).darken(dark ? 5 : 15).toHexString(),
    textOn: '#FFFFFF',
  };
};

// Create context with default value
const defaultThemeKey: ThemeKey = 'blue';
const defaultIsDark = Appearance.getColorScheme() === 'dark';
const ThemeContext = createContext<ThemeContextType>({
  colorTheme: defaultThemeKey,
  setColorTheme: () => {},
  darkMode: defaultIsDark,
  setDarkMode: () => {},
  paperTheme: getThemeForColor(defaultThemeKey, defaultIsDark),
  keyboardAppearance: defaultIsDark ? 'dark' : 'light',
  getAiPrimary: (t = defaultThemeKey, d = defaultIsDark) => getAiPrimary(t, d),
});

// Theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colorTheme, setColorThemeState] = useState<ThemeKey>(defaultThemeKey);
  const [darkMode, setDarkModeState] = useState<boolean>(defaultIsDark);
  const [paperTheme, setPaperTheme] = useState<MD3Theme>(
    getThemeForColor(defaultThemeKey, defaultIsDark)
  );
  
  // Load saved theme and dark mode on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_KEY);
        const savedDarkMode = await AsyncStorage.getItem(DARK_MODE_KEY);

        const currentThemeKey = savedTheme && isValidThemeKey(savedTheme) ? savedTheme : defaultThemeKey;
        const currentIsDark = savedDarkMode !== null ? savedDarkMode === 'true' : defaultIsDark;
        
        setColorThemeState(currentThemeKey);
        setDarkModeState(currentIsDark);
        setPaperTheme(getThemeForColor(currentThemeKey, currentIsDark));
        
        // Apply theme class for web on initial load
        if (Platform.OS === 'web') {
          applyWebTheme(currentThemeKey, currentIsDark);
        }
      } catch (error) {
        console.error('Error loading theme settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  // Update and Save theme
  const handleSetColorTheme = async (newTheme: ThemeKey) => {
    try {
      setColorThemeState(newTheme);
      const newPaperTheme = getThemeForColor(newTheme, darkMode);
      setPaperTheme(newPaperTheme);
      await AsyncStorage.setItem(THEME_KEY, newTheme);
      if (Platform.OS === 'web') {
        applyWebTheme(newTheme, darkMode);
      }
    } catch (error) {
      console.error('Error saving color theme:', error);
    }
  };

  // Update and Save dark mode
  const handleSetDarkMode = async (newIsDark: boolean) => {
    try {
      setDarkModeState(newIsDark);
      const newPaperTheme = getThemeForColor(colorTheme, newIsDark);
      setPaperTheme(newPaperTheme);
      await AsyncStorage.setItem(DARK_MODE_KEY, String(newIsDark));
      if (Platform.OS === 'web') {
        applyWebTheme(colorTheme, newIsDark);
      }
    } catch (error) {
      console.error('Error saving dark mode setting:', error);
    }
  };

  // Apply theme class and CSS variables to html element in web
  const applyWebTheme = (themeKey: ThemeKey, isDark: boolean) => {
    // Remove all theme classes
    document.documentElement.classList.remove(
      'theme-blue', 'theme-purple', 'theme-red', 
      'theme-green', 'theme-yellow', 'theme-teal', 'theme-pink'
    );
    // Add new theme class
    document.documentElement.classList.add(`theme-${themeKey}`);
    // Toggle dark class
    document.documentElement.classList.toggle('dark', isDark);

    // Update CSS variables for web - simplified
    const root = document.documentElement;
    root.style.setProperty('--primary-color', themeOptions[themeKey].color);
    root.style.setProperty('--primary-gradient', themeOptions[themeKey].gradient);
    // Add more variables if needed for dark mode specifics on web
  };
  
  return (
    <ThemeContext.Provider value={{
      colorTheme,
      setColorTheme: handleSetColorTheme,
      darkMode,
      setDarkMode: handleSetDarkMode,
      paperTheme,
      keyboardAppearance: darkMode ? 'dark' : 'light',
      getAiPrimary: (t = colorTheme, d = darkMode) => getAiPrimary(t, d)
    }}>
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