import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatInterface from '../components/ChatInterface';
import * as api from '../services/api';

// Mock the API module
jest.mock('../services/api', () => ({
  sendChatMessage: jest.fn(),
  textToSpeech: jest.fn(),
  speechToText: jest.fn(),
  getConversations: jest.fn(),
  getConversationMessages: jest.fn(),
  createRealtimeConnection: jest.fn(),
  getRealtimeStatus: jest.fn(),
}));

// Mock MediaRecorder
class MockMediaRecorder {
  start = jest.fn();
  ondataavailable = jest.fn();
  onerror = jest.fn();
  onstop = jest.fn();
  state = '';
  stop = jest.fn();
  stream = {
    getTracks: jest.fn().mockReturnValue([{ stop: jest.fn() }]),
  };
  
  constructor(stream: MediaStream, options?: MediaRecorderOptions) {
    // Constructor implementation
  }
  
  static isTypeSupported(type: string): boolean {
    return true;
  }
}

// @ts-ignore - Replace global MediaRecorder with our mock
global.MediaRecorder = MockMediaRecorder as any;

// Mock getUserMedia
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: jest.fn().mockReturnValue([{ stop: jest.fn() }]),
    }),
  },
  writable: true,
});

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  
  send = jest.fn();
  close = jest.fn();
  onopen = jest.fn();
  onmessage = jest.fn();
  onerror = jest.fn();
  onclose = jest.fn();
  readyState = MockWebSocket.OPEN;
  
  constructor(url: string | URL, protocols?: string | string[]) {
    // Constructor implementation
  }
}

// @ts-ignore - Replace global WebSocket with our mock
global.WebSocket = MockWebSocket as any;

// Mock createObjectURL
global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();

describe('ChatInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock API responses
    (api.sendChatMessage as jest.Mock).mockResolvedValue({
      id: 'msg1',
      response: 'Hello from the AI',
      conversationId: 'conv1',
      llmUsed: 'gpt-4o',
    });
    
    (api.textToSpeech as jest.Mock).mockResolvedValue({
      audioUrl: 'mock-audio-url',
    });
    
    (api.speechToText as jest.Mock).mockResolvedValue('Transcribed text');
    
    (api.getConversations as jest.Mock).mockResolvedValue([
      {
        id: 'conv1',
        title: 'Test Conversation',
        createdAt: new Date().toISOString(),
      },
    ]);
    
    (api.getConversationMessages as jest.Mock).mockResolvedValue([
      {
        id: 'msg1',
        role: 'user',
        content: 'Hello',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'msg2',
        role: 'assistant',
        content: 'Hi there!',
        llmUsed: 'gpt-4o',
        createdAt: new Date().toISOString(),
      },
    ]);
    
    // Mock Realtime connection
    const mockRealtimeConnection = {
      connectionId: 'conn-123',
      isConnected: false,
      connect: jest.fn(),
      disconnect: jest.fn(),
      sendVoice: jest.fn(),
      sendText: jest.fn(),
      setSystemPrompt: jest.fn(),
    };
    
    (api.createRealtimeConnection as jest.Mock).mockReturnValue(mockRealtimeConnection);
    (api.getRealtimeStatus as jest.Mock).mockResolvedValue({
      status: 'online',
      activeConnections: 1,
      message: 'Realtime API is online',
    });
  });

  test('renders the chat interface with initial state', () => {
    render(<ChatInterface />);
    
    // Check for mode toggle buttons
    expect(screen.getByText('Text Mode')).toBeInTheDocument();
    expect(screen.getByText('Friendly Mode')).toBeInTheDocument();
    
    // Check for input field and send button
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    expect(screen.getByText('Send')).toBeInTheDocument();
  });

  test('toggles between text and voice modes', () => {
    render(<ChatInterface />);
    
    // Initially in text mode
    expect(screen.getByText('Text Mode')).toBeInTheDocument();
    
    // Click to switch to voice mode
    fireEvent.click(screen.getByText('Text Mode'));
    
    // Now should be in voice mode with a start listening button
    expect(screen.getByText('Voice Mode')).toBeInTheDocument();
    expect(screen.getByText('Start Listening')).toBeInTheDocument();
  });

  test('toggles between friendly and challenging system prompt modes', () => {
    render(<ChatInterface />);
    
    // Initially in friendly mode
    expect(screen.getByText('Friendly Mode')).toBeInTheDocument();
    
    // Click to switch to challenging mode
    fireEvent.click(screen.getByText('Friendly Mode'));
    
    // Now should be in challenging mode
    expect(screen.getByText('Challenge Mode')).toBeInTheDocument();
  });

  test('sends a text message and receives a response', async () => {
    render(<ChatInterface />);
    
    // Type a message
    const inputField = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(inputField, { target: { value: 'Hello AI' } });
    
    // Send the message
    const sendButton = screen.getByText('Send');
    fireEvent.click(sendButton);
    
    // Check that the API was called correctly
    expect(api.sendChatMessage).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Hello AI',
      systemPromptMode: 'friendly',
    }));
    
    // Wait for the response to be displayed
    await waitFor(() => {
      expect(screen.getByText('Hello from the AI')).toBeInTheDocument();
    });
    
    // Check that TTS was called
    expect(api.textToSpeech).toHaveBeenCalledWith({ text: 'Hello from the AI' });
  });

  test('records audio in text mode and processes speech-to-text', async () => {
    render(<ChatInterface />);
    
    // Find and click the record button
    const recordButton = screen.getByRole('button', { name: '' });
    fireEvent.click(recordButton);
    
    // Check that recording started
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    
    // Wait for the recording indicator
    await waitFor(() => {
      expect(screen.getByText('Recording...')).toBeInTheDocument();
    });
    
    // Simulate stopping the recording
    fireEvent.click(recordButton);
    
    // Mock the MediaRecorder.onstop event
    const mediaRecorderInstance = (global.MediaRecorder as unknown as jest.Mock).mock.instances[0];
    await act(async () => {
      if (mediaRecorderInstance && typeof mediaRecorderInstance.onstop === 'function') {
        mediaRecorderInstance.onstop(new Event('stop'));
      }
    });
    
    // Check that STT was called
    expect(api.speechToText).toHaveBeenCalled();
    
    // Wait for the transcribed text and AI response
    await waitFor(() => {
      expect(screen.getByText('Transcribed text')).toBeInTheDocument();
      expect(screen.getByText('Hello from the AI')).toBeInTheDocument();
    });
  });

  test('activates realtime connection in voice mode', async () => {
    render(<ChatInterface initialVoiceMode={true} />);
    
    // Should be in voice mode
    expect(screen.getByText('Voice Mode')).toBeInTheDocument();
    
    // Find and click the start listening button
    const startListeningButton = screen.getByText('Start Listening');
    fireEvent.click(startListeningButton);
    
    // Check that the realtime connection was created and connected
    expect(api.createRealtimeConnection).toHaveBeenCalled();
    
    // Wait for the listening indicator
    await waitFor(() => {
      expect(screen.getByText('Voice mode activated. I\'m listening to you in real-time now.')).toBeInTheDocument();
      expect(screen.getByText('Listening...')).toBeInTheDocument();
    });
    
    // Get the mock realtime connection
    const mockConnection = (api.createRealtimeConnection as jest.Mock).mock.results[0].value;
    expect(mockConnection.connect).toHaveBeenCalled();
    
    // Simulate stopping the realtime connection
    const stopListeningButton = screen.getByText('Stop Listening');
    fireEvent.click(stopListeningButton);
    
    // Check that the connection was disconnected
    expect(mockConnection.disconnect).toHaveBeenCalled();
    
    // Wait for the deactivation message
    await waitFor(() => {
      expect(screen.getByText('Voice mode deactivated.')).toBeInTheDocument();
    });
  });

  test('shows conversation history when toggled', async () => {
    render(<ChatInterface />);
    
    // Initially, conversation history is hidden
    expect(screen.getByText('Show History')).toBeInTheDocument();
    
    // Click to show history
    fireEvent.click(screen.getByText('Show History'));
    
    // Wait for the conversations to load
    await waitFor(() => {
      expect(screen.getByText('Hide History')).toBeInTheDocument();
      expect(screen.getByText('Test Conversation')).toBeInTheDocument();
    });
    
    // Click on a conversation
    fireEvent.click(screen.getByText('Test Conversation'));
    
    // Check that the conversation messages were loaded
    expect(api.getConversationMessages).toHaveBeenCalledWith('conv1');
    
    // Wait for the messages to be displayed
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Hi there!')).toBeInTheDocument();
    });
  });
});
