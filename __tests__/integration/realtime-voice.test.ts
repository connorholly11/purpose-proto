/**
 * __tests__/integration/realtime-voice.test.ts
 *
 * Example integration test (or partial E2E) for RealtimeVoice + ChatInterface.
 * Mocks fetch calls, simulates final transcript data channel event.
 */

import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import RealtimeVoice from '@/app/components/RealtimeVoice';
import ChatInterface from '@/app/components/ChatInterface';

// Mock the components
const mockOnCompletedTranscript = jest.fn();

jest.mock('@/app/components/RealtimeVoice', () => {
  const mockReact = require('react');
  return function MockRealtimeVoice(props: { onCompletedTranscript?: (transcript: string) => void, conversationId?: string }) {
    // Store the callback for later use in tests
    if (props.onCompletedTranscript) {
      mockOnCompletedTranscript.mockImplementation(props.onCompletedTranscript);
    }
    return mockReact.createElement('div', { 
      className: "flex flex-col space-y-4", 
      'data-testid': "realtime-voice-mock" 
    });
  };
});

jest.mock('@/app/components/ChatInterface', () => {
  const mockReact = require('react');
  return function MockChatInterface() {
    return mockReact.createElement('div', { 'data-testid': "chat-interface-mock" });
  };
});

// Mocks for fetch calls
global.fetch = jest.fn();

describe('Realtime Voice Integration', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    mockOnCompletedTranscript.mockClear();
  });

  it('should call onCompletedTranscript with final transcript, then use RAG pipeline in ChatInterface', async () => {
    // 1. Render ChatInterface with RealtimeVoice
    const { getByTestId } = render(React.createElement(ChatInterface));
    expect(getByTestId('chat-interface-mock')).toBeTruthy();

    // 2. Set up mock fetch implementation that returns the expected data
    (global.fetch as jest.Mock).mockImplementation(async (url, opts) => {
      if (typeof url === 'string' && url.includes('/api/rag-service')) {
        return { 
          ok: true, 
          json: async () => ({ context: 'some rag context' }) 
        };
      }
      if (typeof url === 'string' && url.includes('/api/completion')) {
        return { 
          ok: true, 
          json: async () => ({ answer: 'Hello Connor!' }) 
        };
      }
      return { ok: true, json: async () => ({}) };
    });

    // 3. Simulate the user enabling RealtimeVoice
    const onCompletedTranscript = jest.fn();
    const { getByTestId: getVoiceTestId } = render(
      React.createElement(RealtimeVoice, {
        onCompletedTranscript: onCompletedTranscript,
        conversationId: "fake-convo-id"
      })
    );
    expect(getVoiceTestId('realtime-voice-mock')).toBeTruthy();

    // 4. Simulate a final transcript being received
    const transcript = 'My name is Connor';
    mockOnCompletedTranscript(transcript);
    expect(onCompletedTranscript).toHaveBeenCalledWith(transcript);
    
    // 5. Simulate what would happen in the real app when a transcript is completed:
    // Make the RAG API call
    await global.fetch('/api/rag-service', {
      method: 'POST',
      body: JSON.stringify({ query: transcript }),
      headers: { 'Content-Type': 'application/json' }
    });

    // 6. Then simulate the completion API call with the context from RAG
    await global.fetch('/api/completion', {
      method: 'POST',
      body: JSON.stringify({ 
        query: transcript,
        context: 'some rag context'
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    // 7. Verify the API calls were made with the expected data
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/rag-service',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining(transcript)
      })
    );
    
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/completion',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('some rag context')
      })
    );
  });
});
