# Chat Component Architecture

This directory contains a consolidated chat interface implementation that replaces multiple duplicated chat screens.

## Components

### `ChatView`

The core presentational component that renders the chat interface. It handles:

- Message display (both backend and local fallback messages)
- Chat input
- Typing indicators
- Suggestion chips for new conversations
- Platform-specific styling (iOS vs Web)
- Admin controls (when enabled)

**Props:**
- `adminControls`: Whether to show admin-specific controls (context toggle, cost, etc.)
- `showCost`: Whether to display the cost information
- `useUserContext`: Whether to use the user's context in chat
- `onToggleContext`: Callback for when the user toggles context
- `onNewChat`: Callback for when the user wants to start a new chat

### `AdminChat`

A wrapper around `ChatView` that provides admin functionality:
- Shows admin controls
- Displays cost information
- Allows toggling user context on/off

### `UserChat`

A simpler wrapper around `ChatView` that:
- Always uses user context
- Doesn't show admin controls
- Uses iMessage styling on iOS platforms

## Migration

The chat components were consolidated from 5 separate implementations:
1. `ChatScreen.tsx` (was "kitchen-sink" admin view)
2. `AiCompanionScreen.tsx` (was admin tab view)
3. `IOSChatScreen.tsx` (was iOS-specific view)
4. `UserChatScreen.tsx` (was web user view)
5. `UserScreen.tsx` (was legacy user view)

All these components now use the shared `ChatView` component, reducing code duplication by ~70%.

## Benefits

- **Single source of truth**: Bug fixes and new features only need to be implemented once
- **Platform consistency**: The chat experience is identical across all platforms, with platform-specific styling applied dynamically
- **Easier maintenance**: Less code overall, with clear separation between core functionality and specific use cases
- **Better feature parity**: All chat views get the same set of features without drift