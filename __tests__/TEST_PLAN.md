# iOS-Focused Test Implementation Plan

This document outlines the implementation details for the high-value tests identified in our iOS enhancement plan.

## Backend Tests

### 1. LLM Service Retry Logic (`__tests__/llmService.test.ts`)

```typescript
import { callLlmApi } from '../src/services/llmService';
import fetch from 'node-fetch';

// Mock fetch globally
jest.mock('node-fetch', () => jest.fn());

describe('llmService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('should retry on network failure and succeed on the third attempt', async () => {
    // Mock first two calls to fail, third to succeed
    (fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'Success after retry' } }] })
      });

    const messages = [{ role: 'user', content: 'Test message' }];
    const result = await callLlmApi(messages, 'gpt-4o');
    
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(result).toEqual('Success after retry');
  });

  test('should route to the correct API based on model name', async () => {
    // Mock successful responses for different providers
    (fetch as jest.Mock).mockImplementation((url) => {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response from API' } }]
        })
      });
    });

    // Test different model-to-API routing
    await callLlmApi([{ role: 'user', content: 'Test' }], 'gpt-4o');
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('openai'), expect.anything());
    
    jest.clearAllMocks();
    
    await callLlmApi([{ role: 'user', content: 'Test' }], 'claude-3');
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('anthropic'), expect.anything());
  });
});
```

### 2. Terms Guard Middleware (`__tests__/termsGuard.test.ts`)

```typescript
import requireTerms from '../src/middleware/requireTerms';
import { PrismaClient } from '@prisma/client';

// Mock Prisma client
jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    termsAcceptance: {
      findFirst: jest.fn()
    }
  };
  return { 
    PrismaClient: jest.fn(() => mPrismaClient)
  };
});

describe('requireTerms', () => {
  let req, res, next;
  const mockPrisma = new PrismaClient();
  
  beforeEach(() => {
    req = { 
      auth: { userId: 'test-user-id' },
      path: '/api/chat'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    process.env.TERMS_VERSION = '1.0';
  });

  test('should pass through exempt endpoints', async () => {
    req.path = '/api/legal/accept';
    await requireTerms(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(mockPrisma.termsAcceptance.findFirst).not.toHaveBeenCalled();
  });

  test('should allow user with valid terms acceptance to proceed', async () => {
    mockPrisma.termsAcceptance.findFirst.mockResolvedValueOnce({
      id: 'terms-id',
      userId: 'test-user-id',
      version: '1.0',
      acceptedAt: new Date()
    });
    
    await requireTerms(req, res, next);
    
    expect(mockPrisma.termsAcceptance.findFirst).toHaveBeenCalledWith({
      where: {
        userId: 'test-user-id',
        version: '1.0'
      }
    });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should block user without terms acceptance with 403', async () => {
    mockPrisma.termsAcceptance.findFirst.mockResolvedValueOnce(null);
    
    await requireTerms(req, res, next);
    
    expect(mockPrisma.termsAcceptance.findFirst).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Terms not accepted',
      currentVersion: '1.0',
      requiresAcceptance: true
    });
    expect(next).not.toHaveBeenCalled();
  });
});
```

### 3. Push Service Token Pruning (`__tests__/pushService.test.ts`)

```typescript
import { sendAdaReplyPush } from '../src/services/pushService';
import { Expo } from 'expo-server-sdk';
import { PrismaClient } from '@prisma/client';

// Mock Expo Server SDK
jest.mock('expo-server-sdk', () => {
  return {
    Expo: jest.fn(() => ({
      isExpoPushToken: jest.fn(token => token.startsWith('ExponentPushToken')),
      chunkPushNotifications: jest.fn(messages => [messages]),
      sendPushNotificationsAsync: jest.fn(),
      getPushNotificationReceiptsAsync: jest.fn()
    })),
    isExpoPushToken: jest.fn(token => token.startsWith('ExponentPushToken'))
  };
});

// Mock Prisma client
jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    pushToken: {
      findMany: jest.fn(),
      deleteMany: jest.fn()
    }
  };
  return { 
    PrismaClient: jest.fn(() => mPrismaClient)
  };
});

describe('pushService', () => {
  const mockPrisma = new PrismaClient();
  const mockExpo = new Expo();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should delete invalid push tokens when DeviceNotRegistered error occurs', async () => {
    // Mock user with tokens
    const userId = 'test-user-id';
    const validToken = 'ExponentPushToken[valid1234567890]';
    const invalidToken = 'ExponentPushToken[invalid1234567890]';
    
    // Set up token query response
    mockPrisma.pushToken.findMany.mockResolvedValueOnce([
      { id: '1', token: validToken, userId, deviceOS: 'ios', lastSeen: new Date() },
      { id: '2', token: invalidToken, userId, deviceOS: 'ios', lastSeen: new Date() }
    ]);
    
    // Set up receipt responses for device not registered error
    mockExpo.getPushNotificationReceiptsAsync.mockResolvedValueOnce({
      'receipt-invalid': {
        status: 'error',
        message: 'Device not registered',
        details: { error: 'DeviceNotRegistered' }
      }
    });
    
    // Call the function
    await sendAdaReplyPush(userId, 'Test message');
    
    // Assert on getPushNotificationReceiptsAsync and subsequent deleteMany
    expect(mockExpo.chunkPushNotifications).toHaveBeenCalled();
    expect(mockPrisma.pushToken.deleteMany).toHaveBeenCalledWith({
      where: { token: invalidToken }
    });
  });
});
```

### 4. Chat Routes Conversation ID (`__tests__/chatRoutes.test.ts`)

```typescript
import request from 'supertest';
import express from 'express';
import chatRoutes from '../src/routes/chatRoutes';
import { PrismaClient } from '@prisma/client';
import * as llmService from '../src/services/llmService';

// Mock Prisma client
jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    message: {
      createMany: jest.fn(),
      findMany: jest.fn()
    }
  };
  return { 
    PrismaClient: jest.fn(() => mPrismaClient)
  };
});

// Mock LLM service
jest.mock('../src/services/llmService', () => ({
  callLlmApi: jest.fn()
}));

describe('chatRoutes', () => {
  let app;
  const mockPrisma = new PrismaClient();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    app = express();
    app.use(express.json());
    
    // Mock auth middleware
    app.use((req, res, next) => {
      req.auth = { userId: 'test-user-id' };
      next();
    });
    
    app.use('/api/chat', chatRoutes);
  });

  test('should create a new conversation when no ID is provided', async () => {
    // Setup LLM response
    (llmService.callLlmApi as jest.Mock).mockResolvedValueOnce('AI response');
    
    // Setup Prisma response
    mockPrisma.message.createMany.mockResolvedValueOnce({ count: 2 });
    
    const response = await request(app)
      .post('/api/chat')
      .send({ message: 'User message' });
      
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('isNewConversation', true);
    expect(response.body).toHaveProperty('conversationId');
  });
  
  test('should continue existing conversation when ID is provided', async () => {
    // Setup LLM response
    (llmService.callLlmApi as jest.Mock).mockResolvedValueOnce('AI response');
    
    // Setup Prisma response for message history
    mockPrisma.message.findMany.mockResolvedValueOnce([
      { id: 'msg-1', content: 'Previous message', role: 'user' },
      { id: 'msg-2', content: 'Previous response', role: 'assistant' }
    ]);
    
    // Setup Prisma for new messages
    mockPrisma.message.createMany.mockResolvedValueOnce({ count: 2 });
    
    const response = await request(app)
      .post('/api/chat')
      .send({ 
        message: 'New message',
        conversationId: 'existing-convo-id'
      });
      
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('isNewConversation', false);
    expect(response.body).toHaveProperty('conversationId', 'existing-convo-id');
    
    // Verify previous messages were fetched
    expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
      where: { conversationId: 'existing-convo-id' },
      orderBy: { createdAt: 'asc' }
    });
  });
});
```

## Frontend Tests

### 1. ChatContext iOS Integration (`__tests__/ChatContext.ios.test.tsx`)

```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ChatProvider, useChatContext } from '../src/context/ChatContext';
import * as SpeechRecognition from 'expo-speech-recognition';
import axios from 'axios';
import { TextInput } from 'react-native';

// Mock dependencies
jest.mock('expo-speech-recognition', () => ({
  startAsync: jest.fn(),
  stopAsync: jest.fn(),
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  addListener: jest.fn(() => ({ remove: jest.fn() }))
}));

jest.mock('axios', () => ({
  post: jest.fn(),
  isAxiosError: jest.fn()
}));

// A simple test component that uses ChatContext
const TestComponent = () => {
  const { 
    messages, 
    inputText, 
    setInputText, 
    sendMessage, 
    loading,
    startRecording,
    stopRecording,
    tokenCost
  } = useChatContext();
  
  return (
    <>
      <TextInput 
        testID="messageInput"
        value={inputText}
        onChangeText={text => setInputText(text)}
      />
      <button testID="sendButton" onPress={sendMessage}>Send</button>
      <button 
        testID="micButton" 
        onPress={loading ? stopRecording : startRecording}
      >
        {loading ? 'Stop' : 'Mic'}
      </button>
      <div testID="tokenCost">{tokenCost}</div>
      <div testID="messageCount">{messages.length}</div>
    </>
  );
};

describe('ChatContext (iOS)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should update input text with speech recognition results', async () => {
    // Mock the transcript from speech recognition
    const mockSpeechEvent = {
      eventType: 'results',
      results: [{ transcript: 'Hello from speech recognition' }]
    };
    
    // Set up the mock to trigger the listener with results
    (SpeechRecognition.addListener as jest.Mock).mockImplementation(listener => {
      // Simulate receiving results after a short delay
      setTimeout(() => listener(mockSpeechEvent), 100);
      return { remove: jest.fn() };
    });
    
    const { getByTestId } = render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );
    
    // Start recording
    fireEvent.press(getByTestId('micButton'));
    
    // Wait for transcript to be processed
    await waitFor(() => {
      expect(SpeechRecognition.startAsync).toHaveBeenCalled();
      expect(getByTestId('messageInput').props.value).toBe('Hello from speech recognition');
    });
  });
  
  test('should calculate token cost when sending a message', async () => {
    // Mock API response
    (axios.post as jest.Mock).mockResolvedValueOnce({
      data: {
        reply: 'AI response',
        tokenUsage: { 
          promptTokens: 10,
          completionTokens: 15,
          totalTokens: 25
        }
      }
    });
    
    const { getByTestId } = render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );
    
    // Type a message
    fireEvent.changeText(getByTestId('messageInput'), 'Test message');
    
    // Send the message
    fireEvent.press(getByTestId('sendButton'));
    
    // Wait for API response and token calculation
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/chat'),
        expect.objectContaining({ 
          message: 'Test message' 
        })
      );
      
      expect(getByTestId('tokenCost')).toHaveTextContent('25');
      expect(getByTestId('messageCount')).toHaveTextContent('2'); // User + AI
    });
  });
});
```

### 2. SignIn Legal Flow (`__tests__/SignInConsent.test.tsx`)

```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LegalModal from '../src/screens/LegalModal';
import axios from 'axios';

// Mock dependencies
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn()
}));

describe('Legal Consent Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock API response for legal document
    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: '# Terms of Service\n\nThis is a long terms document...'
    });
  });
  
  test('Accept button should be disabled until scrolled to end', async () => {
    const onCloseMock = jest.fn();
    
    const { getByText, getByTestId } = render(
      <LegalModal
        visible={true}
        onClose={onCloseMock}
        docType="terms"
        requireAcceptance={true}
      />
    );
    
    // Wait for content to load
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/legal/terms')
      );
    });
    
    // Verify accept button is disabled initially
    const acceptButton = getByText('I Accept');
    expect(acceptButton.props.accessibilityState.disabled).toBe(true);
    
    // Simulate scroll to end
    fireEvent.scroll(getByTestId('terms-scroll'), {
      nativeEvent: {
        contentOffset: { y: 1000 },
        layoutMeasurement: { height: 300 },
        contentSize: { height: 1300 },
      }
    });
    
    // Verify button is now enabled
    await waitFor(() => {
      expect(acceptButton.props.accessibilityState.disabled).toBe(false);
    });
    
    // Press accept button
    fireEvent.press(acceptButton);
    
    // Verify API call is made
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/legal/accept');
      expect(onCloseMock).toHaveBeenCalled();
    });
  });
  
  test('Non-required legal modal should allow immediate closing', async () => {
    const onCloseMock = jest.fn();
    
    const { getByText } = render(
      <LegalModal
        visible={true}
        onClose={onCloseMock}
        docType="privacy"
        requireAcceptance={false}
      />
    );
    
    // Wait for content to load
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/legal/privacy')
      );
    });
    
    // Press close button
    fireEvent.press(getByText('Close'));
    
    // Verify onClose was called
    expect(onCloseMock).toHaveBeenCalled();
  });
});
```

### 3. Expo Speech Recognition Mock Setup (`__tests__/setup.js`)

```javascript
// Mock for expo-speech-recognition
jest.mock('expo-speech-recognition', () => ({
  startAsync: jest.fn().mockResolvedValue(undefined),
  stopAsync: jest.fn().mockResolvedValue(undefined),
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  addListener: jest.fn((listener) => {
    // Store the listener so tests can trigger it manually
    global.speechRecognitionListener = listener;
    
    return {
      remove: jest.fn()
    };
  })
}));

// Helper to simulate speech recognition results
global.simulateSpeechResult = (transcript) => {
  if (global.speechRecognitionListener) {
    global.speechRecognitionListener({
      eventType: 'results',
      results: [{ transcript }]
    });
  } else {
    console.warn('Speech recognition listener not registered');
  }
};

// Force Platform.OS to be 'ios' for iOS-specific tests
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: (obj) => obj.ios || obj.default
}));

// Set up necessary mocks for React Native
require('react-native-reanimated/mock');

// Silence console.error and console.warn in tests
console.error = jest.fn();
console.warn = jest.fn();
```

## Jest config

### Backend Jest Config (`backend/jest.config.js`)

```diff
 module.exports = {
   preset: 'ts-jest',
   testEnvironment: 'node',
+  clearMocks: true,
+  collectCoverage: true,
+  collectCoverageFrom: ['src/**/*.ts'],
+  coverageThreshold: { global: { lines: 70 } },
 };
```

### Frontend Jest Config (`frontend/jest.config.js`) 

Add:

```js
collectCoverage: false,        // React‑Native coverage is slow; enable if needed
setupFilesAfterEnv: [
  '@testing-library/jest-native/extend-expect',
  './__tests__/setup.js'
],
```

## Execution order (sprint plan)

1. **Backend** – pushService, requireTerms ⇒ catches regressions that could break prod.  
2. **Backend** – llmService (retry math), chatRoutes (conversation ID).  
3. **Frontend** – add speech mock in setup.js, then ChatContext test, then SignInConsent.

Running both projects:

```bash
npm run -w backend test
npm run -w frontend test
```

Expect **6 tests** (backend) + **2 tests** (frontend) to pass.

## Test Implementation Strategy

For the next sprint, we should prioritize these tests in the following order:

1. **Backend Tests**:
   - pushService.test.ts (token pruning) - High priority for production stability
   - requireTerms.test.ts - Important for legal compliance

2. **Frontend Tests**:
   - ChatContext.ios.test.tsx - Critical for core app functionality
   - setup.js mocks - Needed for all other frontend tests

3. **Follow-up Tests**:
   - llmService.test.ts
   - chatRoutes.test.ts
   - SignInConsent.test.tsx

We'll use Jest with React Native Testing Library for frontend tests and Jest with Supertest for backend API tests. Each test should have proper mocking to avoid external dependencies and ensure consistent test results.

## Quick Fixes Summary

1. **Backend**:
   - LLM Service Test: Use `global.fetch` instead of `node-fetch`.
   - Terms Guard: Use `requireTerms` and `req.auth.userId` instead of `req.user.id`.
   - Push Service: Test `getPushNotificationReceiptsAsync` output and subsequent `deleteMany`.
   - Chat Routes: Use `req.auth.userId` and `message.createMany`.

2. **Frontend**:
   - ChatContext: Use `useChatContext` instead of `useChat`, use `loading` not `isRecording`.
   - SignInConsent: Use `accessibilityState.disabled` and add `testID="terms-scroll"` to ScrollView.
   - Jest config: Add coverage threshold and setup files.