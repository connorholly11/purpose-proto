import 'dotenv/config'; // Make sure .env variables are loaded
import { ExpoConfig, ConfigContext } from '@expo/config';

// Define the structure of your environment variables if needed
// interface Environment {
//   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
// }

// Flag to control whether Instabug plugin is included - using explicit boolean coercion
const includeInstabug = process.env.INCLUDE_INSTABUG_PLUGIN === 'true';

// Hard bail-out for web builds
if (!includeInstabug && process.env.EAS_BUILD_PROFILE?.includes('web')) {
  console.log('Instabug plugin skipped for web build');
}

export default ({ config }: ConfigContext): ExpoConfig => {
  // Basic app configuration from existing app.json or defaults
  const appConfig: ExpoConfig = {
    ...config, // Spread the existing config determined by Expo CLI
    slug: config.slug ?? 'purpose', // Use existing slug or default
    name: config.name ?? 'Purpose', // Use existing name or default
    // Add other base configurations if they are not in app.json
    plugins: [
      // Merge existing plugins from config if any, or start fresh
      ...(config.plugins ?? []),
      // Add the required plugins
      "expo-secure-store",
      "expo-notifications",
      // Conditionally include Instabug configuration with additional production guard
      ...(includeInstabug && (process.env.NODE_ENV === 'production' || process.env.FORCE_INSTABUG === 'true')
        ? [["instabug-reactnative", {
            iosAppToken: process.env.INSTABUG_IOS_TOKEN,
            invocationEvents: ["shake", "screenshot"],
            primaryColor: "#2196F3"
          }]]
        : [])
    ],
    ios: {
      ...(config.ios || {}),
      usesNotifications: true,
      scheme: "purpose",
      infoPlist: {
        ...(config.ios?.infoPlist || {}),
        NSPushNotificationUsageDescription: "We use notifications to let you know when you receive new messages.",
      }
    },
    android: {
      ...(config.android || {}),
      // Uncomment the line below when you have a google-services.json file
      // googleServicesFile: './google-services.json'
    }
  };

  // Get the Clerk key from environment variables
  const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // Validate the key (optional but recommended)
  if (!clerkPublishableKey || clerkPublishableKey.length < 10) {
    console.warn('WARNING: EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is missing or invalid in .env');
    // Decide if you want to throw an error during build or just warn
    // throw new Error('Missing Clerk Publishable Key in environment variables during build.');
  }

  // Get the API URL from environment
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  
  // STRICT validation - refuse to build if API URL is invalid
  if (!apiUrl || /(localhost|^172\.)/.test(apiUrl)) {
    throw new Error('EXPO_PUBLIC_API_URL must be a LAN-reachable address (e.g. 192.168.x.x)');
  }

  // Embed the key and API URL into the build-time config under 'extra'
  appConfig.extra = {
    ...config.extra, // Preserve existing extra config (like EAS projectId)
    clerkPublishableKey: clerkPublishableKey,
    apiUrl: apiUrl,
    instabugEnabled: includeInstabug,
  };

  return appConfig;
}; 