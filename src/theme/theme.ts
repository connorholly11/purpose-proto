import { MD3LightTheme, MD3DarkTheme, MD3Theme } from 'react-native-paper';
import { Platform } from 'react-native';
import { ThemeKey, themeOptions } from './colors';

// Define our brand colors
const colors = {
  primary: '#007AFF', // iOS blue
  secondary: '#60a5fa',
  error: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  info: '#0A84FF',
  background: '#FFFFFF',
  surface: '#F2F2F7',
  surfaceVariant: '#EFEFF4',
  onSurface: '#000000',
  onSurfaceVariant: '#3C3C43',
  outline: '#CCCCCC',
  elevation: {
    level0: 'transparent',
    level1: '#FFFFFF',
    level2: '#FFFFFF',
    level3: '#FFFFFF',
    level4: '#FFFFFF',
    level5: '#FFFFFF',
  },
};

// Create the base theme without custom fonts
export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...colors,
  },
  roundness: 8,
};

// Define base light/dark themes for the factory function (using default fonts)
const baseLight: MD3Theme = {
  ...MD3LightTheme,
  roundness: 8,
};
const baseDark: MD3Theme = {
  ...MD3DarkTheme,
  roundness: 8,
};

// Function to create a theme based on color and dark mode
export const getThemeForColor = (themeKey: ThemeKey, isDark: boolean): MD3Theme => {
  const baseTheme = isDark ? baseDark : baseLight; // Use bases with default fonts
  const primaryColor = themeOptions[themeKey].color;
  const primaryContainerColor = themeOptions[themeKey].color + (isDark ? '40' : '20');
  const specificErrorColor = themeKey === 'red' ? (isDark ? '#fca5a5' : '#991b1b') : (isDark ? '#f87171' : '#dc2626');
  
  // Define light and dark specific color overrides
  const colorOverrides = isDark
    ? {
        background: '#121212',
        surface: '#1e1e1e',
        surfaceVariant: '#2c2c2c',
        surfaceHeader: '#1e1e1e',
        surfaceInput: '#2c2c2c',
        onSurface: '#e0e0e0',
        onSurfaceVariant: '#bdbdbd',
        outline: '#424242',
      }
    : {
        background: '#FFFFFF',
        surface: '#F2F2F7',
        surfaceVariant: '#EFEFF4',
        surfaceHeader: '#F2F2F7',
        surfaceInput: '#EFEFF4',
        onSurface: '#000000',
        onSurfaceVariant: '#3C3C43',
        outline: '#CCCCCC',
      };

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      ...colorOverrides,
      primary: primaryColor,
      onPrimary: '#FFFFFF',
      primaryContainer: primaryContainerColor,
      onPrimaryContainer: primaryColor,
      secondary: primaryColor,
      error: specificErrorColor,
    },
  };
};

// Typography scales
export const typography = {
  displayLarge: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: Platform.select({ ios: '700', android: 'bold', default: '700' }),
    letterSpacing: 0.25,
  },
  displayMedium: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: Platform.select({ ios: '700', android: 'bold', default: '700' }),
    letterSpacing: 0,
  },
  displaySmall: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: Platform.select({ ios: '700', android: 'bold', default: '700' }),
    letterSpacing: 0,
  },
  headlineLarge: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: Platform.select({ ios: '600', android: 'bold', default: '600' }),
    letterSpacing: 0,
  },
  headlineMedium: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: Platform.select({ ios: '600', android: 'bold', default: '600' }),
    letterSpacing: 0,
  },
  headlineSmall: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: Platform.select({ ios: '600', android: 'bold', default: '600' }),
    letterSpacing: 0,
  },
  titleLarge: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: Platform.select({ ios: '600', android: 'bold', default: '600' }),
    letterSpacing: 0,
  },
  titleMedium: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: Platform.select({ ios: '500', android: 'medium', default: '500' }),
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: Platform.select({ ios: '500', android: 'medium', default: '500' }),
    letterSpacing: 0.1,
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: Platform.select({ ios: '400', android: 'normal', default: '400' }),
    letterSpacing: 0.15,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: Platform.select({ ios: '400', android: 'normal', default: '400' }),
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: Platform.select({ ios: '400', android: 'normal', default: '400' }),
    letterSpacing: 0.4,
  },
  labelLarge: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: Platform.select({ ios: '500', android: 'medium', default: '500' }),
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: Platform.select({ ios: '500', android: 'medium', default: '500' }),
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: Platform.select({ ios: '500', android: 'medium', default: '500' }),
    letterSpacing: 0.5,
  },
};