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
      ...(config.plugins || []),
      // Add the required plugin
      "expo-secure-store"
    ]
  };

  // Get the Clerk key from environment variables
  const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // Validate the key (optional but recommended)
  if (!clerkPublishableKey || clerkPublishableKey.length < 10) {
    console.warn('WARNING: EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is missing or invalid in .env');
    // Decide if you want to throw an error during build or just warn
    // throw new Error('Missing Clerk Publishable Key in environment variables during build.');
  }

  // Embed the key into the build-time config under 'extra'
  appConfig.extra = {
    ...config.extra, // Preserve existing extra config (like EAS projectId)
    clerkPublishableKey: clerkPublishableKey,
  };

  return appConfig;
}; 