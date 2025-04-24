import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import Constants from 'expo-constants';
import { AuthProvider, useAuthContext } from './src/context/AuthContext';
import { ChatProvider } from './src/context/ChatContext';
import { SystemPromptProvider, useSystemPrompts } from './src/context/SystemPromptContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { HapticsProvider } from './src/context/HapticsContext';
import { AdminProvider } from './src/context/AdminContext';
import AppNavigator from './src/navigation/AppNavigator';
import { View, Text, StyleSheet, Platform, StatusBar } from 'react-native';

// Get the Clerk key from the embedded Expo config
const clerkPubKey = Constants.expoConfig?.extra?.clerkPublishableKey as string;

// A simple screen to show if the key is missing
const MissingKeyScreen = () => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorTitle}>Configuration Error</Text>
    <Text style={styles.errorMessage}>
      Clerk publishable key is missing.
    </Text>
    <Text style={styles.errorDetails}>
      Please ensure EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is set in your .env file and rebuild the app if necessary.
    </Text>
  </View>
);

export default function App() {
  // Add a guard clause: If the key wasn't embedded correctly, show an error screen
  if (!clerkPubKey) {
    return <MissingKeyScreen />;
  }

  // Key is present, proceed with the app structure
  return (
    <ThemeProvider>
      <HapticsProvider>
        <AdminProvider>
          <ThemedSafeAreaProvider clerkPubKey={clerkPubKey} />
        </AdminProvider>
      </HapticsProvider>
    </ThemeProvider>
  );
}

// Themed SafeAreaProvider component
function ThemedSafeAreaProvider({ clerkPubKey }: { clerkPubKey: string }) {
  const { paperTheme, darkMode } = useTheme();
  
  // Apply theme to safe area edges for iOS
  return (
    <SafeAreaProvider 
      style={{ 
        backgroundColor: darkMode ? 
          (paperTheme.colors as any).surfaceHeader : 
          (paperTheme.colors as any).surfaceHeader
      }}
    >
      <ThemedApp clerkPubKey={clerkPubKey} />
    </SafeAreaProvider>
  );
}

// Component that uses the theme
function ThemedApp({ clerkPubKey }: { clerkPubKey: string }) {
  const { paperTheme, darkMode } = useTheme();
  
  // Hook to register for notifications - will be called when user context changes
  const PushNotificationSetup = () => {
    // This is an iOS-only app
    if (Platform.OS !== 'ios') return null;
    
    // Using require to import to avoid circular dependencies
    const { useRegisterForPush, setupNotifications } = require('./src/services/push');
    // Store this in a variable that won't change between renders to prevent effect re-runs
    const registerForPush = useRegisterForPush();
    const [isRegistered, setIsRegistered] = useState(false);
    // Reference to track if we've already set up - prevents duplicate execution
    const setupRef = useRef(false);
    
    // Use React's useEffect for the setup - with empty array to only run once
    useEffect(() => {
      // Guard against duplicate setups
      if (setupRef.current) return;
      setupRef.current = true;
      
      console.log('[PUSH DEBUG] Setting up notification handlers (once per app session)');
      // Set up notification handlers immediately (doesn't require auth)
      const { cleanup } = setupNotifications();
      
      // Register for push notifications and track completion
      (async () => {
        try {
          console.log('[PUSH DEBUG] Starting push registration from App.tsx');
          // Makes sure we wait for registration to complete before showing UI
          await registerForPush();
          setIsRegistered(true);
          console.log('[PUSH DEBUG] Push registration completed successfully');
        } catch (error) {
          console.error('[PUSH DEBUG] Error registering for push notifications:', error);
          setIsRegistered(true); // Still mark as completed so UI shows
        }
      })();
      
      return cleanup;
    }, []); // Empty dependency array - only run once
    
    // This is a "headless" component that just registers effects
    return null;
  };
  
  // Import hook to access active system prompt
  const SystemPromptAccessor = ({ children }: { children: React.ReactNode }) => {
    const { activePrompt } = useSystemPrompts();
    
    return (
      <ChatProvider activePrompt={activePrompt}>
        {children}
      </ChatProvider>
    );
  };

  return (
    <PaperProvider theme={paperTheme}>
      <ClerkProvider publishableKey={clerkPubKey} tokenCache={tokenCache}>
        <AuthProvider>
          <SystemPromptProvider>
            <SystemPromptAccessor>
              {/* Register for push notifications */}
              <PushNotificationSetup />
              <AppNavigator />
            </SystemPromptAccessor>
          </SystemPromptProvider>
        </AuthProvider>
      </ClerkProvider>
      
      {/* status‑bar font/icon colour + background */}
      {Platform.OS === 'ios' ? (
        <StatusBar
          animated={true}
          barStyle={darkMode ? 'light-content' : 'dark-content'}
        />
      ) : (
        <StatusBar
          animated={true}
          barStyle={darkMode ? 'light-content' : 'dark-content'}
          backgroundColor={(paperTheme.colors as any).surfaceHeader}
        />
      )}
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#dc3545',
  },
  errorMessage: {
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
    color: '#343a40',
  },
  errorDetails: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6c757d',
  },
});
