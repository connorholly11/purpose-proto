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
  AdminScreen
} from '../screens';
import { ParamListBase, RouteProp } from '@react-navigation/native';
import AppHeader from '../components/AppHeader';

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
};

// Create the stack navigator
const Stack = createNativeStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Main Tab Navigator component (used when authenticated)
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: RouteProp<ParamListBase, string> }) => ({
        tabBarIcon: ({ color, size }: { color: string; size: number }) => {
          let iconName: keyof typeof MaterialIcons.glyphMap = 'chat-bubble';

          if (route.name === 'Prompts') {
            iconName = 'settings';
          } else if (route.name === 'Admin') {
            iconName = 'admin-panel-settings';
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
    </Tab.Navigator>
  );
};

// Main App Navigator
export const AppNavigator = () => {
  const { isSignedIn, isLoaded } = useAuthContext();

  // --- Add Logging ---
  console.log('[AppNavigator] Auth Context State:', { isLoaded, isSignedIn });
  // --- End Logging ---

  // Show nothing while auth is loading
  if (!isLoaded) {
    // --- Add Logging ---
    console.log('[AppNavigator] Rendering null because isLoaded is false.');
    // --- End Logging ---
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