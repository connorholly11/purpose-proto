# Chat Component Architecture

This directory contains the refactored chat components, structured according to the separation of concerns pattern.

## Directory Structure

```
frontend/src/chat/
├── ChatPage.tsx        - Main orchestrator component (~150 lines)
├── header/             - Header components
│   ├── ChatHeader.tsx  - User/admin variants via props
│   └── iosHeader.tsx   - iOS-specific header
├── list/               - Message list components
│   ├── MessageList.tsx - FlatList/ScrollView switcher
│   ├── MessageBubble.tsx
│   └── TypingIndicator.tsx
├── input/              - Input components
│   └── Composer.tsx    - Text input + send button
├── hooks/              - Shared logic
│   ├── useAutoScroll.ts
│   ├── useComposer.ts
│   └── useAdminToggle.ts
└── styles/             - Shared styles
    ├── colors.ts
    └── bubbles.ts
```

## Component Props

### ChatPage

```typescript
type ChatPageProps = {
  admin?: boolean;
  platform?: 'ios' | 'android' | 'web';
};
```

### MessageList

```typescript
type MessageListProps = {
  messages: Message[];
  loading: boolean;
  onScroll: (event: any) => void;
  scrollRef: React.RefObject<FlatList | ScrollView>;
  admin?: boolean;
  platform: 'ios' | 'android' | 'web';
};
```

### Composer

```typescript
type ComposerProps = {
  inputText: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onKeyPress?: (e: any) => void;
  loading: boolean;
  platform: 'ios' | 'android' | 'web';
};
```

### ChatHeader

```typescript
type ChatHeaderProps = {
  admin: boolean;
  conversationId: string | null;
  currentModel: string | null;
  conversationCost: number;
  useUserContext: boolean;
  onContextToggle: (value: boolean) => void;
  onNewChat: () => void;
};
```

## Hooks

### useAutoScroll

Manages scroll behavior including scrolling to bottom on new messages and showing/hiding the scroll button.

### useComposer

Manages input text state, sending messages, and handling key presses.

### useAdminToggle

Manages admin mode toggling and user context settings.

## Usage

Use the `ChatPage` component directly with appropriate props:

```typescript
<ChatPage 
  admin={true} // Set to true for admin mode, false for user mode
  platform="web" // Optional platform override
/>
```

For legacy code compatibility, thin wrapper components are provided in `components/chat/`:
- `AdminChat.tsx`
- `UserChat.tsx`

And the main `ChatScreen.tsx` has been updated to use the new component.