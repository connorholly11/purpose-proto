/**
 * Utility functions for styles and theming
 */

// Define spacing values
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

/**
 * Creates a shadow style for elements
 * @param elevation - The elevation level (1-24)
 * @returns Shadow style object
 */
export function createShadow(elevation: number = 2) {
  return {
    boxShadow: `0px ${elevation * 0.5}px ${elevation * 2}px rgba(0,0,0,0.1)`,
  };
}

/**
 * Pre-defined shadow styles for different use cases
 */
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

/**
 * Creates a colored shadow for elements
 * @param color - The shadow color (CSS color value)
 * @param elevation - The elevation level (1-24)
 * @returns Colored shadow style object
 */
export function createColoredShadow(color: string, elevation: number = 1) {
  const opacity = Math.min(0.6, 0.15 + (elevation * 0.05));
  const hexOpacity = Math.round(opacity * 255).toString(16).padStart(2, '0');
  
  return {
    boxShadow: `0px ${elevation * 0.5}px ${elevation * 2}px ${color}${hexOpacity}`,
  };
}