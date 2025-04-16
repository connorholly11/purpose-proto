import React, { createContext, useContext, useState } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthContext } from '../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { 
  SignInScreen, 
  ChatScreen, 
  AdminPromptScreen, 
  AdminUserScreen, 
  AdminScreen,
  SummarizationStatusScreen,
  PlaceholderDashboardScreen,
  TestingScreen,
  EvalScreen,
  AiCompanionScreen,
  QuestsScreen,
  ProfileScreen
} from '../screens';
import AppHeader from '../components/AppHeader';
import { FeedbackButton } from '../components';

// Import useAdminMode from AppHeader instead of declaring it here
import { AdminContext, useAdminMode } from '../components/AppHeader';

// Define the stack navigator parameter types
export type AppStackParamList = {
  SignIn: undefined;
  Main: undefined;
};

// Define the bottom tab navigator parameter types
export type MainTabParamList = {
  AICompanion: undefined;
  Quests: undefined;
  Profile: undefined;
  Dashboard: undefined;
  Prompts: undefined;
  Admin: undefined;
  Testing: undefined;
  Eval: undefined;
};

// Create the stack navigator
const Stack = createNativeStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Main Tab Navigator component (used when authenticated)
const MainTabNavigator = () => {
  const { isAdminMode } = useAdminMode();
  
  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName: keyof typeof MaterialIcons.glyphMap = 'chat-bubble';

            if (route.name === 'AICompanion') {
              iconName = 'chat-bubble';
            } else if (route.name === 'Quests') {
              iconName = 'emoji-events';
            } else if (route.name === 'Profile') {
              iconName = 'person';
            } else if (route.name === 'Dashboard') {
              iconName = 'dashboard';
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
          // Show header for all users to maintain consistent UI
          header: () => <AppHeader />,
          // Always show tab bar
          tabBarStyle: { 
            display: 'flex'
          },
        })}
      >
        {/* User tabs - always show these three tabs regardless of mode */}
        <Tab.Screen
          name="AICompanion"
          component={AiCompanionScreen}
          options={{
            title: 'AI Companion',
          }}
        />
        <Tab.Screen
          name="Quests"
          component={QuestsScreen}
          options={{
            title: 'Quests',
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            title: 'Profile',
          }}
        />
        
        {/* Admin tabs - show only in admin mode and not on iOS */}
        {(Platform.OS !== 'ios' && isAdminMode) && (
          <>
            <Tab.Screen
              name="Dashboard"
              component={PlaceholderDashboardScreen}
              options={{
                title: 'Dashboard',
              }}
            />
            <Tab.Screen
              name="Prompts"
              component={AdminPromptScreen}
              options={{
                title: 'System Prompts',
              }}
            />
            <Tab.Screen
              name="Admin"
              component={AdminScreen}
              options={{
                title: 'Admin Tools',
              }}
            />
            <Tab.Screen
              name="Testing"
              component={TestingScreen}
              options={{
                title: 'Testing',
              }}
            />
            <Tab.Screen
              name="Eval"
              component={EvalScreen}
              options={{
                title: 'Evaluations',
              }}
            />
          </>
        )}
      </Tab.Navigator>
      
      {/* Only show feedback button in admin mode and not on iOS */}
      {(Platform.OS !== 'ios' && isAdminMode) && <FeedbackButton />}
    </>
  );
};

// Main App Navigator
export const AppNavigator = () => {
  const { isSignedIn, isLoaded } = useAuthContext();
  // Force isAdminMode to always be false on iOS
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Show nothing while auth is loading
  if (!isLoaded) {
    return null;
  }

  return (
    <AdminContext.Provider value={{ isAdminMode, setIsAdminMode }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isSignedIn ? (
            // Authenticated screens
            <Stack.Screen
              name="Main"
              component={MainTabNavigator}
            />
          ) : (
            // Authentication screens
            <Stack.Screen
              name="SignIn"
              component={SignInScreen}
              options={{ headerShown: false }}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AdminContext.Provider>
  );
};

export default AppNavigator;
