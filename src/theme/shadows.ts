import { Platform } from 'react-native';

// A utility for creating consistent shadows across platforms
export const createShadow = (level: number = 1) => {
  // Shadow intensity based on level
  const opacity = Math.min(0.6, 0.1 + (level * 0.04));
  
  return Platform.select({
    ios: {
      shadowColor: 'rgba(0,0,0,0.3)',
      shadowOffset: { 
        width: 0, 
        height: level 
      },
      shadowOpacity: opacity,
      shadowRadius: level * 0.7,
    },
    android: {
      elevation: level,
    },
    default: {}, // Fallback for other platforms
  });
};

// Preset shadow styles for different use cases
export const shadows = {
  none: createShadow(0),
  small: createShadow(1),
  medium: createShadow(2),
  large: createShadow(4),
  extraLarge: createShadow(8),
  
  // Specialized shadows for different UI elements
  card: createShadow(2),
  button: createShadow(1),
  modal: createShadow(4),
  fab: createShadow(3),
};

// Utility for creating a colored shadow (eg. for branded elements)
export const createColoredShadow = (color: string, level: number = 1) => {
  const opacity = Math.min(0.6, 0.15 + (level * 0.05));
  
  return Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { 
        width: 0, 
        height: level 
      },
      shadowOpacity: opacity,
      shadowRadius: level * 0.8,
    },
    android: {
      // Android doesn't support colored shadows directly
      // So we use the standard elevation
      elevation: level,
    },
    default: {},
  });
};