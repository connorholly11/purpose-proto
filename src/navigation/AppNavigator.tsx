import React, { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, InitialState, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { useAuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAdmin } from '../context/AdminContext';
import { 
  SignInScreen, 
  ProfileSheet
} from '../screens';
import AdminRootDebug from '../screens/AdminRootDebug';

import { UserChat } from '../components';

// Define the stack navigator parameter types
export type AppStackParamList = {
  SignIn: undefined;
  UserRoot: undefined;
  AdminRoot: undefined;
  ProfileSheet: undefined; // Add ProfileSheet to app stack for admin mode
};

// Define the user stack navigator parameter types
export type UserStackParamList = {
  Chat: undefined;
  ProfileSheet: undefined;
};

// Context to share admin toggle information
export const AdminContext = React.createContext({
  isAdmin: false,
  toggleAdmin: () => {}
});

// Create the stack navigators
const Stack = createNativeStackNavigator<AppStackParamList>();
const UserStackNav = createNativeStackNavigator<UserStackParamList>();

// User Stack Navigator - single screen with profile sheet
const UserStack = () => {
  const { isAdmin, toggleAdmin } = React.useContext(AdminContext);
  
  return (
    <UserStackNav.Navigator 
      screenOptions={{ 
        headerShown: false,
        // This is critical - it prevents view unmounting when modal is opened
        detachInactiveScreens: false
      }}
    >
      <UserStackNav.Group>
        <UserStackNav.Screen 
          name="Chat" 
          component={UserChat} 
        />
      </UserStackNav.Group>
      {Platform.OS === 'ios' && (
        <UserStackNav.Group screenOptions={{ 
          presentation: 'modal',
          animationEnabled: true,
          // Prevent recreation when themes change
          freezeOnBlur: true
        }}>
          <UserStackNav.Screen 
            name="ProfileSheet" 
            component={ProfileSheet} 
            options={{ 
              headerShown: false,
            }}
          />
        </UserStackNav.Group>
      )}
    </UserStackNav.Navigator>
  );
};

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
  const { unlocked } = useAdmin();
  const [adminView, setAdminView] = useState(false);
  const [initialState, setInitialState] = useState<InitialState | undefined>();
  const [isStateLoaded, setIsStateLoaded] = useState(false);
  const navigationRef = useRef<any>(null);

  // Native-only state restoration - explicitly separate from theme
  useEffect(() => {
    const restoreState = async () => {
      try {
        const savedStateString = await AsyncStorage.getItem(NAV_STATE_KEY);
        if (savedStateString) { setInitialState(JSON.parse(savedStateString)); }
      } catch (e) { console.error("Failed to load navigation state", e); }
      setIsStateLoaded(true);
    };
    // Only run once and NOT dependent on paperTheme
    if (!isStateLoaded) { restoreState(); }
  }, [isStateLoaded]);

  const saveState = async (state: any) => {
    try {
      const jsonState = JSON.stringify(state);
      await AsyncStorage.setItem(NAV_STATE_KEY, jsonState);
    } catch (e) { console.error("Failed to save navigation state", e); }
  };

  // Function to toggle admin view
  const toggleAdmin = () => {
    console.log("Toggle admin from", adminView, "to", !adminView);
    setAdminView(!adminView);
  };

  if (!isLoaded || !isStateLoaded) {
    return null;
  }

  return (
    <AdminContext.Provider value={{ isAdmin: adminView, toggleAdmin }}>
      <NavigationContainer
        ref={navigationRef}
        linking={linking}
        initialState={initialState}
        onStateChange={saveState}
        theme={paperTheme as any}
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
          ) : adminView && unlocked ? (
            // Admin stack when admin mode is toggled on
            <>
              <Stack.Screen
                name="AdminRoot"
                component={AdminRootDebug}
              />
              {Platform.OS === 'ios' && (
                <Stack.Group screenOptions={{ 
                  presentation: 'modal',
                  animationEnabled: true,
                  freezeOnBlur: true
                }}>
                  <Stack.Screen 
                    name="ProfileSheet" 
                    component={ProfileSheet} 
                    options={{ 
                      headerShown: false,
                    }}
                  />
                </Stack.Group>
              )}
            </>
          ) : (
            // User stack for all platforms
            <Stack.Screen
              name="UserRoot"
              component={UserStack}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AdminContext.Provider>
  );
};

export { AppNavigator };

export default AppNavigator;