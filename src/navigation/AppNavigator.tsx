import React, { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, InitialState, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { useAuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  SignInScreen, 
  ProfileSheet
} from '../screens';

import { UserChat } from '../components';

// Define the stack navigator parameter types
export type AppStackParamList = {
  SignIn: undefined;
  UserRoot: undefined;
};

// Define the user stack navigator parameter types
export type UserStackParamList = {
  Chat: undefined;
  ProfileSheet: undefined;
};

// Create the stack navigators
const Stack = createNativeStackNavigator<AppStackParamList>();
const UserStackNav = createNativeStackNavigator<UserStackParamList>();

// User Stack Navigator - single screen with profile sheet
const UserStack = () => (
  <UserStackNav.Navigator screenOptions={{ headerShown: false }}>
    <UserStackNav.Group>
      <UserStackNav.Screen name="Chat" component={UserChat} />
    </UserStackNav.Group>
    {Platform.OS === 'ios' && (
      <UserStackNav.Group screenOptions={{ presentation: 'modal' }}>
        <UserStackNav.Screen 
          name="ProfileSheet" 
          component={ProfileSheet} 
          options={{ headerShown: false }}
        />
      </UserStackNav.Group>
    )}
  </UserStackNav.Navigator>
);

// Define the linking configuration using Expo's helper
const urlPrefix = Linking.createURL('/');

const linking: LinkingOptions<AppStackParamList> = {
  prefixes: [urlPrefix],  // No platform check needed
  config: {
    screens: {
      UserRoot: {
        path: '',  // "/" maps to user stack
        screens: { 
          Chat: ''  // Root path goes to Chat
        }
      }
    }
  }
};

// Deep linking configuration is handled by Expo

const NAV_STATE_KEY = 'NAVIGATION_STATE';

// Main App Navigator
const AppNavigator = () => {
  const { isSignedIn, isLoaded } = useAuthContext();
  const { paperTheme } = useTheme();
  const [initialState, setInitialState] = useState<InitialState | undefined>();
  const [isStateLoaded, setIsStateLoaded] = useState(false);
  const navigationRef = useRef<any>(null);

  // Native-only state restoration
  useEffect(() => {
    const restoreState = async () => {
      try {
        const savedStateString = await AsyncStorage.getItem(NAV_STATE_KEY);
        if (savedStateString) { setInitialState(JSON.parse(savedStateString)); }
      } catch (e) { console.error("Failed to load navigation state", e); }
      setIsStateLoaded(true);
    };
    if (!isStateLoaded) { restoreState(); }
  }, [isStateLoaded]);

  const saveState = async (state: any) => {
    try {
      const jsonState = JSON.stringify(state);
      await AsyncStorage.setItem(NAV_STATE_KEY, jsonState);
    } catch (e) { console.error("Failed to save navigation state", e); }
  };

  if (!isLoaded || !isStateLoaded) {
    return null;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      initialState={initialState}
      onStateChange={saveState}
    >
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          /* 🔑 dark‑aware colours */
          headerStyle: { backgroundColor: (paperTheme.colors as any).surfaceHeader },
          headerTitleStyle: { color: paperTheme.colors.onSurface },
          headerTintColor: paperTheme.colors.onSurface,  // back chevron & icons
        }}
      >
        {!isSignedIn ? (
          // Authentication screens
          <Stack.Screen
            name="SignIn"
            component={SignInScreen}
            options={{ headerShown: false }}
          />
        ) : (
          // User stack for all platforms
          <Stack.Screen
            name="UserRoot"
            component={UserStack}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export { AppNavigator };

export default AppNavigator;