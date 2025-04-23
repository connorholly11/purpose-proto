import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Initialize Instabug only on iOS platform
 * This adapter ensures only iOS ever loads the real module
 */
export async function initInstabug() {
  // Only run on iOS platform and if instabug is enabled in the build
  if (Platform.OS !== 'ios') return;
  // Check if Instabug is enabled in the build
  if (Constants.expoConfig?.extra?.instabugEnabled !== true) {
    console.log('[Instabug] Disabled in this build (not compiled in)');
    return;
  }
  
  try {
    // Dynamically import Instabug to prevent web from evaluating its require chain
    const Instabug = (await import('instabug-reactnative')).default;
    const { InvocationEvent } = await import('instabug-reactnative');
    
    if (!Instabug?.init) {
      console.warn("[Instabug] Native module missing – skipping");
      return;
    }
    
    // Initialize Instabug with the provided token
    Instabug.init({
      token: '3e952ee49d8e4d6151bfa6a9207a4ff7',
      invocationEvents: [
        InvocationEvent.shake,
        InvocationEvent.screenshot,
        InvocationEvent.floatingButton
      ],
    });
    
    return Instabug;
  } catch (error) {
    console.warn('Error initializing Instabug:', error);
    return null;
  }
}

/**
 * Set Instabug color theme based on app theme
 */
export async function setInstabugTheme(darkMode: boolean) {
  if (Platform.OS !== 'ios') return;
  // Check if Instabug is enabled in the build
  if (Constants.expoConfig?.extra?.instabugEnabled !== true) return;
  
  try {
    const Instabug = (await import('instabug-reactnative')).default;
    if (!Instabug?.setColorTheme) return;
    
    Instabug.setColorTheme(darkMode ? Instabug.colorTheme.dark : Instabug.colorTheme.light);
  } catch (error) {
    console.warn('Error setting Instabug theme:', error);
  }
}

/**
 * Set user attribute in Instabug
 */
export async function setInstabugUserAttribute(key: string, value: string) {
  if (Platform.OS !== 'ios') return;
  // Check if Instabug is enabled in the build
  if (Constants.expoConfig?.extra?.instabugEnabled !== true) return;
  
  try {
    const Instabug = (await import('instabug-reactnative')).default;
    if (!Instabug?.setUserAttribute) return;
    
    Instabug.setUserAttribute(key, value);
  } catch (error) {
    console.warn(`Error setting Instabug user attribute ${key}:`, error);
  }
}

/**
 * Set up Instabug report submission handler
 */
export async function setupInstabugReportHandler(handler: (report: any) => Promise<void>) {
  if (Platform.OS !== 'ios') return;
  // Check if Instabug is enabled in the build
  if (Constants.expoConfig?.extra?.instabugEnabled !== true) return;
  
  try {
    const Instabug = (await import('instabug-reactnative')).default;
    if (!Instabug?.onReportSubmitHandler) return;
    
    Instabug.onReportSubmitHandler(handler);
  } catch (error) {
    console.warn('Error setting up Instabug report handler:', error);
  }
}