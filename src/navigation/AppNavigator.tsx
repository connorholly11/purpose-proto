import React from 'react';
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
  SummarizationStatusScreen
} from '../screens';
import AppHeader from '../components/AppHeader';

// Import our new TestingScreen
import TestingScreen from '../screens/TestingScreen'; // <--- NEW IMPORT

// Define the stack navigator parameter types
export type AppStackParamList = {
  SignIn: undefined;
  Main: undefined;
};

// Define the bottom tab navigator parameter types
export type MainTabParamList = {
  Chat: undefined;
  Prompts: undefined;
  Admin: undefined;
  Testing: undefined; // <--- NEW
};

// Create the stack navigator
const Stack = createNativeStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Main Tab Navigator component (used when authenticated)
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof MaterialIcons.glyphMap = 'chat-bubble';

          if (route.name === 'Prompts') {
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
        header: () => <AppHeader />,
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
  );
};

// Main App Navigator
export const AppNavigator = () => {
  const { isSignedIn, isLoaded } = useAuthContext();

  // Show nothing while auth is loading
  if (!isLoaded) {
    return null;
  }

  return (
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
  );
};

export default AppNavigator;
