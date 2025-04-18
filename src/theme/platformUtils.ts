import { Platform, StyleSheet, PlatformOSType } from 'react-native';

type PlatformStyle<T> = {
  [K in PlatformOSType | 'default']?: T;
};

/**
 * Utility for creating platform-specific styles in a clean way
 * @param styles - Object with platform keys and style values
 * @returns The style for the current platform
 */
export function platformSelect<T>(styles: PlatformStyle<T>): T {
  const platform = Platform.OS as PlatformOSType;
  return styles[platform] || styles.default || {};
}

/**
 * Default spacing values that are consistent across platforms
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

/**
 * Shadow style utility that works consistently across platforms
 * @param elevation - The elevation level (1-24)
 * @returns Platform-specific shadow styles
 */
export function getShadow(elevation: number = 2) {
  return platformSelect({
    ios: {
      shadowColor: 'rgba(0,0,0,0.3)',
      shadowOffset: { width: 0, height: elevation },
      shadowOpacity: 0.2,
      shadowRadius: elevation * 0.7,
    },
    android: {
      elevation,
    },
    web: {
      boxShadow: `0px ${elevation * 0.5}px ${elevation * 2}px rgba(0,0,0,0.1)`,
    },
    default: {},
  });
}

/**
 * Creates a platform-specific style sheet
 * @param styles - Regular StyleSheet.create input, but can include platform-specific keys
 * @returns StyleSheet with platform-specific styles resolved
 */
export function createPlatformStyleSheet<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  styles: { [K in keyof T]: any }
): T {
  const platformStyles: { [key: string]: any } = {};

  // Process each style property for platform-specific variants
  Object.keys(styles).forEach((key) => {
    const style = styles[key];
    
    // Handle iOS, android, and web specific properties
    if (style.ios || style.android || style.web || style.default) {
      platformStyles[key] = platformSelect({
        ios: style.ios,
        android: style.android,
        web: style.web,
        default: style.default,
      });
      
      // Merge with the non-platform properties
      const {ios, android, web, default: defaultStyle, ...rest} = style;
      platformStyles[key] = {...rest, ...platformStyles[key]};
    } else {
      platformStyles[key] = style;
    }
  });

  return StyleSheet.create(platformStyles);
}

/**
 * Keyboard behavior appropriate for each platform
 */
export const keyboardBehavior = Platform.select({
  ios: 'padding',
  default: undefined,
}) as 'padding' | 'height' | undefined;

/**
 * Platform-specific keyboard offset
 */
export const keyboardVerticalOffset = Platform.select({
  ios: 0,
  android: 0,
  default: 0,
});