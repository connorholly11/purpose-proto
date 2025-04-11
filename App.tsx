import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { AuthProvider } from './src/context/AuthContext';
import { ChatProvider } from './src/context/ChatContext';
import { SystemPromptProvider } from './src/context/SystemPromptContext';
import AppNavigator from './src/navigation/AppNavigator';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { theme } from './src/theme';

export default function App() {
  const clerkPubKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const [clerkError, setClerkError] = useState(false);
  
  useEffect(() => {
    if (!clerkPubKey || clerkPubKey.length < 50) {
      console.error('Missing or invalid Clerk Publishable Key!');
      setClerkError(true);
    }
  }, [clerkPubKey]);
  
  if (clerkError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Authentication Error</Text>
        <Text style={styles.errorMessage}>
          Invalid or missing Clerk authentication key. Please check your environment variables.
        </Text>
        {Platform.OS === 'web' && (
          <Text style={styles.errorDetails}>
            This app requires a valid Clerk Publishable Key to function properly.
            Please add a valid key to your .env file.
          </Text>
        )}
      </View>
    );
  }
  
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <ClerkProvider publishableKey={clerkPubKey || ''} tokenCache={tokenCache}>
          <AuthProvider>
            <SystemPromptProvider>
              <ChatProvider>
                <AppNavigator />
              </ChatProvider>
            </SystemPromptProvider>
          </AuthProvider>
        </ClerkProvider>
      </PaperProvider>
    </SafeAreaProvider>
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
