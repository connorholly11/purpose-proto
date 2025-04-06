import React, { createContext, useContext, useState } from 'react';
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
  PlaceholderDashboardScreen
} from '../screens';
import AppHeader from '../components/AppHeader';
import { FeedbackButton } from '../components';

// Import our new TestingScreen
import TestingScreen from '../screens/TestingScreen'; // <--- NEW IMPORT

// Create a context to track admin mode state
type AdminModeContextType = {
  isAdminMode: boolean;
  setIsAdminMode: (value: boolean) => void;
};

export const AdminModeContext = createContext<AdminModeContextType>({
  isAdminMode: false,
  setIsAdminMode: () => {},
});

export const useAdminMode = () => useContext(AdminModeContext);

// Define the stack navigator parameter types
export type AppStackParamList = {
  SignIn: undefined;
  Main: undefined;
};

// Define the bottom tab navigator parameter types
export type MainTabParamList = {
  Chat: undefined;
  Dashboard: undefined;
  Prompts: undefined;
  Admin: undefined;
  Testing: undefined; // <--- NEW
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

            if (route.name === 'Dashboard') {
              iconName = 'dashboard';
            } else if (route.name === 'Prompts') {
              iconName = 'settings';
            } else if (route.name === 'Admin') {
              iconName = 'admin-panel-settings';
            } else if (route.name === 'Testing') {
              iconName = 'science'; // or any other icon
            }

            return <MaterialIcons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007bff',
          tabBarInactiveTintColor: 'gray',
          header: () => isAdminMode ? <AppHeader /> : null,
          tabBarStyle: { 
            display: isAdminMode ? 'flex' : 'none' 
          },
        })}
      >
        <Tab.Screen
          name="Chat"
          component={ChatScreen}
          options={{
            title: 'AI Companion',
          }}
        />
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
        {/* NEW TESTING TAB */}
        <Tab.Screen
          name="Testing"
          component={TestingScreen}
          options={{
            title: 'Testing',
          }}
        />
      </Tab.Navigator>
      
      {/* Only show feedback button in admin mode */}
      {isAdminMode && <FeedbackButton />}
    </>
  );
};

// Main App Navigator
export const AppNavigator = () => {
  const { isSignedIn, isLoaded } = useAuthContext();
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Show nothing while auth is loading
  if (!isLoaded) {
    return null;
  }

  return (
    <AdminModeContext.Provider value={{ isAdminMode, setIsAdminMode }}>
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
    </AdminModeContext.Provider>
  );
};

export default AppNavigator;
