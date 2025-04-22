import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, InitialState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthContext } from '../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { 
  SignInScreen, 
  AdminPromptScreen, 
  AdminUserScreen, 
  AdminScreen,
  SummarizationStatusScreen,
  TestingScreen,
  EvalScreen,
  QuestsScreen,
  ProfileScreen,
  SettingsScreen,
  ProfileSheet
} from '../screens';

import { AdminChat, UserChat } from '../components';
import AppHeader from '../components/AppHeader';
import { FeedbackButton } from '../components';

// Import useAdminMode from AppHeader instead of declaring it here
import { AdminContext } from '../components/AppHeader';

// Define the stack navigator parameter types
export type AppStackParamList = {
  SignIn: undefined;
  UserRoot: undefined;
  AdminRoot: undefined;
};

// Define the user stack navigator parameter types
export type UserStackParamList = {
  Chat: undefined;
  Settings: undefined;
  ProfileSheet: undefined;
};

// Define the bottom tab navigator parameter types
export type AdminTabParamList = {
  AICompanion: undefined;
  Quests: undefined;
  Profile: undefined;
  // Dashboard removed and deprecated
  Prompts: undefined;
  Admin: undefined;
  Testing: undefined;
  Eval: undefined;
};

// Create the stack navigators
const Stack = createNativeStackNavigator<AppStackParamList>();
const UserStackNav = createNativeStackNavigator<UserStackParamList>();
const AdminTabs = createBottomTabNavigator<AdminTabParamList>();

// User Stack Navigator - single screen with settings
const UserStack = () => (
  <AdminContext.Provider value={{ isAdminMode: false, isAdminSection: false }}>
    <UserStackNav.Navigator screenOptions={{ headerShown: false }}>
      <UserStackNav.Group>
        <UserStackNav.Screen name="Chat" component={UserChat} />
        <UserStackNav.Screen name="Settings" component={SettingsScreen} />
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
  </AdminContext.Provider>
);

// Admin Tab Navigator component (only shown at /admin on web)
const AdminTabNavigator = () => {
  // Add state for toggling between admin and user views
  const [isAdminMode, setIsAdminMode] = React.useState(true);
  
  return (
    <AdminContext.Provider value={{ 
      isAdminMode, 
      setIsAdminMode, 
      isAdminSection: true // This indicates we're in the admin section
    }}>
      {isAdminMode ? (
        // Show admin view with all tabs
        <>
          <AdminTabs.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ color, size }) => {
                let iconName: keyof typeof MaterialIcons.glyphMap = 'chat-bubble';

                if (route.name === 'AICompanion') {
                  iconName = 'chat-bubble';
                } else if (route.name === 'Quests') {
                  iconName = 'emoji-events';
                } else if (route.name === 'Profile') {
                  iconName = 'person';
                // Dashboard tab removed and deprecated
                } else if (route.name === 'Prompts') {
                  iconName = 'settings';
                } else if (route.name === 'Admin') {
                  iconName = 'admin-panel-settings';
                } else if (route.name === 'Testing') {
                  iconName = 'science';
                } else if (route.name === 'Eval') {
                  iconName = 'score';
                }

                return <MaterialIcons name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: '#007bff',
              tabBarInactiveTintColor: 'gray',
              header: () => <AppHeader />,
            })}
          >
            {/* User tabs */}
            <AdminTabs.Screen
              name="AICompanion"
              component={AdminChat}
              options={{ title: 'AI Companion' }}
            />
            <AdminTabs.Screen
              name="Quests"
              component={QuestsScreen}
              options={{ title: 'Quests' }}
            />
            <AdminTabs.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ title: 'Profile' }}
            />
            
            {/* Admin tabs - Dashboard removed and deprecated */}
            <AdminTabs.Screen
              name="Prompts"
              component={AdminPromptScreen}
              options={{ title: 'System Prompts' }}
            />
            <AdminTabs.Screen
              name="Admin"
              component={AdminScreen}
              options={{ title: 'Admin Tools' }}
            />
            <AdminTabs.Screen
              name="Testing"
              component={TestingScreen}
              options={{ title: 'Testing' }}
            />
            <AdminTabs.Screen
              name="Eval"
              component={EvalScreen}
              options={{ title: 'Evaluations' }}
            />
          </AdminTabs.Navigator>
          
          {/* Show feedback button in admin mode */}
          <FeedbackButton />
        </>
      ) : (
        // Show user view - no tabs, just the chat screen
        <UserStackNav.Navigator screenOptions={{ 
          headerShown: true, 
          header: () => <AppHeader /> 
        }}>
          <UserStackNav.Screen 
            name="Chat" 
            component={UserChat} 
          />
          <UserStackNav.Screen 
            name="Settings" 
            component={SettingsScreen} 
          />
        </UserStackNav.Navigator>
      )}
    </AdminContext.Provider>
  );
};

// Define the linking configuration for web
const linking = {
  prefixes: [Platform.OS === 'web' ? window.location.origin : 'myapp://'],
  config: {
    screens: {
      AdminRoot: {
        path: 'admin',
        screens: { // <-- Define nested screens for AdminTabs
          AICompanion: 'AICompanion',
          Quests: 'Quests',
          Profile: 'Profile',
          Prompts: 'Prompts',
          Admin: 'Admin',
          Testing: 'Testing',
          Eval: 'Eval',
        }
      },
      UserRoot: { 
        path: '', 
        screens: { 
          Chat: 'chat',
          Settings: 'settings',
        },
      },
      // Consider adding a NotFound screen for unhandled paths
    },
  },
};

const NAV_STATE_KEY = 'NAVIGATION_STATE';

// Main App Navigator
const AppNavigator = () => {
  const { isSignedIn, isLoaded } = useAuthContext();
  const { paperTheme } = useTheme();
  const [initialState, setInitialState] = useState<InitialState | undefined>();
  const [isStateLoaded, setIsStateLoaded] = useState(false);

  useEffect(() => {
    const restoreState = async () => {
      try {
        const savedStateString = Platform.OS === 'web'
          ? localStorage.getItem(NAV_STATE_KEY)
          : await AsyncStorage.getItem(NAV_STATE_KEY);

        if (savedStateString) {
          setInitialState(JSON.parse(savedStateString));
        }
      } catch (e) {
        console.error("Failed to load navigation state", e);
      } finally {
        setIsStateLoaded(true);
      }
    };

    if (!isStateLoaded) {
      restoreState();
    }
  }, [isStateLoaded]);

  const saveState = async (state: any) => {
    try {
      const jsonState = JSON.stringify(state);
      if (Platform.OS === 'web') {
        localStorage.setItem(NAV_STATE_KEY, jsonState);
      } else {
        await AsyncStorage.setItem(NAV_STATE_KEY, jsonState);
      }
    } catch (e) {
      console.error("Failed to save navigation state", e);
    }
  };

  if (!isLoaded || !isStateLoaded) {
    return null;
  }

  return (
    <NavigationContainer
      linking={Platform.OS !== 'ios' ? linking : undefined}
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
        ) : Platform.OS === 'ios' ? (
          // iOS shows only the user stack
          <Stack.Screen
            name="UserRoot"
            component={UserStack}
          />
        ) : (
          // Web has both user and admin routes
          <>
            <Stack.Screen
              name="UserRoot"
              component={UserStack}
            />
            <Stack.Screen
              name="AdminRoot"
              component={AdminTabNavigator}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export { AppNavigator };

export default AppNavigator;