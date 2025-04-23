# Push Notifications Implementation

This document explains the implementation of push notifications in the app, covering both iOS and Android platforms.

## Overview

The implementation provides:
1. A centralized push notification service in `src/services/push.ts`
2. Platform-specific handling for iOS and Android
3. Web-safe stubs to prevent errors in web builds
4. Token registration with the backend

## Files Modified

1. **Added `src/services/push.ts`**: Core implementation of push notifications
2. **Added `src/hooks/useClerkTokenGetter.ts`**: Utility for getting Clerk tokens
3. **Updated `src/hooks/index.ts`**: Exported the new hook
4. **Added web stubs**:
   - `src/stubs/expo-notifications.ts`
   - `src/stubs/expo-device.ts`
5. **Modified `metro.config.js`**: Added aliases for web stubs
6. **Updated `app.config.ts`**: Added plugin configuration
7. **Updated `App.tsx`**: Added web environment guard

## How It Works

### Registration Flow

1. `App.tsx` initializes the `PushNotificationSetup` component
2. `setupNotifications()` configures how notifications are handled
3. `useRegisterForPush()` requests permissions, retrieves an Expo push token, and registers it with the backend
4. The backend stores the token and can send notifications through the Expo push service

### Platform-Specific Handling

- **iOS**: Requests permission and registers for Apple Push Notification Service (APNs)
- **Android**: Will use Firebase Cloud Messaging (FCM) once configured
- **Web**: Uses stubs to prevent errors

## Configuration

### iOS

The iOS configuration includes:
- `aps-environment` entitlement (already set to "development")
- `usesNotifications: true` in app.config.ts
- NSPushNotificationUsageDescription for the permission prompt

### Android

For Android, you'll need to:
1. Create a Firebase project
2. Generate a `google-services.json` file
3. Uncomment the `googleServicesFile` line in `app.config.ts`

## Usage in Development

- When testing locally, run: `npx expo prebuild -p ios && npx expo run:ios`
- For web development: `npm run dev:web` (stubs will prevent errors)

## Backend Integration

The push service calls the endpoint:
```
POST /api/push/register
{
  token: "ExponentPushToken[...]",
  deviceOS: "ios" | "android"
}
```

This endpoint is already implemented in the backend.