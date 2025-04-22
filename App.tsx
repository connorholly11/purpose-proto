import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import Constants from 'expo-constants';
import { AuthProvider } from './src/context/AuthContext';
import { ChatProvider } from './src/context/ChatContext';
import { SystemPromptProvider } from './src/context/SystemPromptContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { HapticsProvider } from './src/context/HapticsContext';
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
    <SafeAreaProvider>
      <ThemeProvider>
        <HapticsProvider>
          <ThemedApp clerkPubKey={clerkPubKey} />
        </HapticsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

// Component that uses the theme
function ThemedApp({ clerkPubKey }: { clerkPubKey: string }) {
  const { paperTheme, darkMode } = useTheme();
  
  return (
    <PaperProvider theme={paperTheme}>
      <ClerkProvider publishableKey={clerkPubKey} tokenCache={tokenCache}>
        <AuthProvider>
          <SystemPromptProvider>
            <ChatProvider>
              <AppNavigator />
            </ChatProvider>
          </SystemPromptProvider>
        </AuthProvider>
      </ClerkProvider>
      
      {/* status‑bar font/icon colour + background */}
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={(paperTheme.colors as any).surfaceHeader}
      />
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
