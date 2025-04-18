# Deprecated Screens

This directory contains screen components that have been replaced or consolidated but are kept for backward compatibility.

## Contents

### Chat Screens

These chat screens were consolidated into a single `ChatView` component with wrapper components:
- `ChatScreen.tsx` - Replaced by `AdminChat`
- `AiCompanionScreen.tsx` - Replaced by `AdminChat` 
- `IOSChatScreen.tsx` - Replaced by `UserChat`
- `UserChatScreen.tsx` - Replaced by `UserChat`
- `UserScreen.tsx` - Replaced by `UserChat`

The new implementation in `../components/chat` reduces code duplication by ~70% and maintains identical functionality.

### Settings Screens

Settings screens were consolidated:
- `IOSSettingsScreen.tsx` - Replaced by the shared `SettingsScreen` component
- `UserSettingsScreen.tsx` - Replaced by the shared `SettingsScreen` component

### Other Screens

- `PlaceholderDashboardScreen.tsx` - Example dashboard UI with detailed graphs and metrics visualization

## Migration

All exports are still maintained in the main `../index.ts` file pointing to these deprecated versions for backward compatibility.