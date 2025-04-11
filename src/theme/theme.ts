import { MD3LightTheme, configureFonts } from 'react-native-paper';
import { Platform } from 'react-native';

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

// Font configuration
const fontConfig = {
  ios: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300' as const,
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100' as const,
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '700' as const,
    },
  },
  android: {
    regular: {
      fontFamily: 'sans-serif',
      fontWeight: 'normal' as const,
    },
    medium: {
      fontFamily: 'sans-serif-medium',
      fontWeight: 'normal' as const,
    },
    light: {
      fontFamily: 'sans-serif-light',
      fontWeight: 'normal' as const,
    },
    thin: {
      fontFamily: 'sans-serif-thin',
      fontWeight: 'normal' as const,
    },
    bold: {
      fontFamily: 'sans-serif',
      fontWeight: 'bold' as const,
    },
  },
  web: {
    regular: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fontWeight: '500' as const,
    },
    light: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fontWeight: '300' as const,
    },
    thin: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fontWeight: '100' as const,
    },
    bold: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fontWeight: '700' as const,
    },
  },
};

// Create the theme
export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...colors,
  },
  fonts: configureFonts({ config: fontConfig, isV3: true }),
  roundness: 8,
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