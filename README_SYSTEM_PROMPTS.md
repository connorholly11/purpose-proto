# System Prompts Implementation

This document explains the implementation of the SystemPromptContext and how it's integrated with the rest of the application.

## Overview

The SystemPromptContext provides a way to:
1. Fetch system prompts from the backend
2. Select an active prompt
3. Make the active prompt available to the ChatContext

## Files Changed

1. **Created `src/context/SystemPromptContext.tsx`**: The main context file that handles fetching and managing system prompts
2. **Created `src/context/index.ts`**: Barrel file for convenient importing of all contexts
3. **Updated `src/context/ChatContext.tsx`**: Added support for using an active system prompt
4. **Updated `App.tsx`**: Connected SystemPromptProvider and ChatProvider with the active prompt flowing between them

## How It Works

### SystemPromptContext

This context provides:
- `prompts`: Array of all available prompts
- `activePrompt`: The currently selected prompt
- `loading`, `error`: State for async operations
- `refresh()`: Method to reload prompts from the backend
- `setActivePrompt(id)`: Method to select a specific prompt

### Integration with ChatContext

The ChatProvider now accepts an optional `activePrompt` prop of type `SystemPrompt`. When sending a message, it uses:
```typescript
activePrompt?.id ?? overridePromptId
```

This gives priority to the active prompt from SystemPromptContext while maintaining backward compatibility with the existing `overridePromptId` parameter.

### App.tsx Changes

We created a `SystemPromptAccessor` component that:
1. Uses the `useSystemPrompts` hook to access the active prompt
2. Passes that prompt to the ChatProvider

## API Endpoints

The SystemPromptContext expects the backend to have an endpoint:
```
GET /api/prompts?scope=user
```

Which returns data in the format:
```json
{
  "prompts": [
    {
      "id": "prompt-id",
      "name": "Prompt Name",
      "text": "The prompt text content...",
      "modelName": "claude-3.5-sonnet",
      "isFavorite": false
    }
  ]
}
```

## Future Enhancements

1. **UI for Selection**: Add a prompt selector UI component in the ProfileSheet or as a modal
2. **Persistence**: Save the last used prompt ID to AsyncStorage for persistence between app launches
3. **CRUD Operations**: Add endpoints and methods for creating, updating, and deleting custom prompts