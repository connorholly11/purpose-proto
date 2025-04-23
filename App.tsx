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
import AppNavigator from './src/navigation/AppNavigator';
import { View, Text, StyleSheet, Platform, StatusBar } from 'react-native';

// Instabug will be dynamically imported at runtime

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
        <ThemedSafeAreaProvider clerkPubKey={clerkPubKey} />
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
  
  // Initialize Instabug only on native platforms using our adapter
  useEffect(() => {
    const initInstabugWithTheme = async () => {
      // Import the adapter functions
      const { initInstabug, setInstabugTheme, setupInstabugReportHandler } = await import('./src/utils/instabug');
      
      // Initialize Instabug
      await initInstabug();
      
      // Set theme based on app theme
      await setInstabugTheme(darkMode);
      
      // Set up report handler
      await setupInstabugReportHandler(async (report: { reportType: string; message: string }) => {
        try {
          // Using require to avoid circular dependencies
          const { createAuthenticatedApi } = require('./src/services/api');
          const { useAuth } = require('@clerk/clerk-expo');
          
          // Create an authenticated API instance
          const getToken = async () => {
            try {
              const token = await useAuth().getToken();
              return token;
            } catch (error) {
              console.error('Error getting token for Instabug feedback:', error);
              return null;
            }
          };
          
          const api = createAuthenticatedApi(getToken);
          
          // Submit to our backend
          await api.post('/api/feedback', {
            category: 'Bug Report',
            content: `${report.reportType}: ${report.message}`,
          });
          
          console.log('Successfully bridged Instabug report to backend');
        } catch (error) {
          console.error('Failed to send Instabug report to backend:', error);
        }
      });
    };
    
    // Run the async initialization
    initInstabugWithTheme().catch(error => {
      console.warn('Error in Instabug initialization:', error);
    });
  }, [darkMode]);
  
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
  
  // Component to set user attributes in Instabug when auth state changes
  const InstabugUserSetup = () => {
    const { isSignedIn, userId } = useAuthContext();
    
    useEffect(() => {
      // Only run when signed in and user ID is available
      if (isSignedIn && userId) {
        const setupUserAttribute = async () => {
          try {
            // Import the adapter function
            const { setInstabugUserAttribute } = await import('./src/utils/instabug');
            
            // Set the user attribute
            await setInstabugUserAttribute('clerkId', userId);
            console.log('Set Instabug user attribute:', userId);
          } catch (error) {
            console.warn('Error setting Instabug user attribute:', error);
          }
        };
        
        setupUserAttribute();
      }
    }, [isSignedIn, userId]);
    
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
              {/* Set up Instabug user attributes */}
              <InstabugUserSetup />
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
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
    color: '#212529',
  },
  errorDetails: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6c757d',
    maxWidth: 600,
  },
});
