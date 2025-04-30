/**
 * Web theme configuration that removes React Native Paper dependencies
 */

// Define our brand colors
export const colors = {
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

// Font configuration for web
export const fonts = {
  regular: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontWeight: '400',
  },
  medium: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontWeight: '500',
  },
  light: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontWeight: '300',
  },
  thin: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontWeight: '100',
  },
  bold: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontWeight: '700',
  },
};

// Create the theme
export const theme = {
  colors,
  fonts,
  roundness: 8,
};

// Typography scales for web
export const typography = {
  displayLarge: {
    fontSize: '26px',
    lineHeight: '34px',
    fontWeight: '700',
    letterSpacing: '0.25px',
  },
  displayMedium: {
    fontSize: '22px',
    lineHeight: '28px',
    fontWeight: '700',
    letterSpacing: '0',
  },
  displaySmall: {
    fontSize: '18px',
    lineHeight: '24px',
    fontWeight: '700',
    letterSpacing: '0',
  },
  headlineLarge: {
    fontSize: '20px',
    lineHeight: '26px',
    fontWeight: '600',
    letterSpacing: '0',
  },
  headlineMedium: {
    fontSize: '18px',
    lineHeight: '24px',
    fontWeight: '600',
    letterSpacing: '0',
  },
  headlineSmall: {
    fontSize: '16px',
    lineHeight: '22px',
    fontWeight: '600',
    letterSpacing: '0',
  },
  titleLarge: {
    fontSize: '17px',
    lineHeight: '22px',
    fontWeight: '600',
    letterSpacing: '0',
  },
  titleMedium: {
    fontSize: '16px',
    lineHeight: '21px',
    fontWeight: '500',
    letterSpacing: '0.15px',
  },
  titleSmall: {
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: '500',
    letterSpacing: '0.1px',
  },
  bodyLarge: {
    fontSize: '16px',
    lineHeight: '22px',
    fontWeight: '400',
    letterSpacing: '0.15px',
  },
  bodyMedium: {
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: '400',
    letterSpacing: '0.25px',
  },
  bodySmall: {
    fontSize: '12px',
    lineHeight: '16px',
    fontWeight: '400',
    letterSpacing: '0.4px',
  },
  labelLarge: {
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: '500',
    letterSpacing: '0.1px',
  },
  labelMedium: {
    fontSize: '12px',
    lineHeight: '16px',
    fontWeight: '500',
    letterSpacing: '0.5px',
  },
  labelSmall: {
    fontSize: '11px',
    lineHeight: '16px',
    fontWeight: '500',
    letterSpacing: '0.5px',
  },
};