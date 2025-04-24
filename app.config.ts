import 'dotenv/config'; // Make sure .env variables are loaded
import { ExpoConfig, ConfigContext } from '@expo/config';

// Define the structure of your environment variables if needed
// interface Environment {
//   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
// }

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
      package: "com.purpose.app"
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
  
  // STRICT validation - only enforce in development mode
  if (process.env.EAS_BUILD_PROFILE === 'development' && (!apiUrl || /(localhost|^172\.)/.test(apiUrl))) {
    throw new Error('EXPO_PUBLIC_API_URL must be a LAN-reachable address (e.g. 192.168.x.x) for development');
  }

  // Embed the key and API URL into the build-time config under 'extra'
  appConfig.extra = {
    ...config.extra, // Preserve existing extra config (like EAS projectId)
    clerkPublishableKey: clerkPublishableKey,
    apiUrl: apiUrl,
    adminPassword: process.env.EXPO_PUBLIC_ADMIN_PASSWORD || '123', // Simple default password
  };

  return appConfig;
}; 