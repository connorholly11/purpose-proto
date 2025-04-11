import { Platform } from 'react-native';

/**
 * Object to track direct Platform.OS usages that should be replaced with utility functions
 */
export const platformChecks = {
  /**
   * Count of direct Platform.OS checks 
   * This can be used in tests to ensure that direct Platform.OS 
   * checks are declining over time as they're migrated to utilities
   */
  count: 0,
  
  /**
   * Registered locations of Platform.OS checks
   * This can help identify areas that need refactoring
   */
  locations: [] as string[],
  
  /**
   * Reset counters (useful for testing)
   */
  reset() {
    this.count = 0;
    this.locations = [];
  },
  
  /**
   * Register a direct Platform.OS check (for testing purposes)
   * In production code, use the utilities instead
   */
  register(location: string) {
    this.count++;
    this.locations.push(location);
    return Platform.OS; // still return the actual value
  }
};

/**
 * Function to check if a component or style is using direct Platform.OS checks
 * @param code The code to check
 * @returns Whether the code contains direct Platform.OS checks
 */
export function containsDirectPlatformChecks(code: string): boolean {
  // Look for direct Platform.OS checks not wrapped in utility functions
  const platformOSRegex = /Platform\.OS\s*===|\s+Platform\.OS\s+==|\s+Platform\.OS\s+!=|Platform\.OS\s*!==|Platform\.select\s*\(\s*{/g;
  return platformOSRegex.test(code);
}

/**
 * Type for snapshot testing markers
 * This helps identify platform-specific code in snapshots
 */
export type PlatformSnapshot = {
  ios: string;
  android: string;
  web: string;
  current: string;
};

/**
 * Creates platform-specific markers for snapshot tests
 * @param feature The name of the feature or component
 * @returns Object with platform-specific markers
 */
export function createPlatformSnapshot(feature: string): PlatformSnapshot {
  return {
    ios: `${feature}-ios-snapshot`,
    android: `${feature}-android-snapshot`,
    web: `${feature}-web-snapshot`,
    current: `${feature}-${Platform.OS}-snapshot`,
  };
}