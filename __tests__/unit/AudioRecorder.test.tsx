import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AudioRecorder from '@/app/components/AudioRecorder';
import '@testing-library/jest-dom';

// Mock the MediaRecorder API
const mockMediaRecorder = {
  start: jest.fn(),
  stop: jest.fn(),
  ondataavailable: jest.fn(),
  onstop: jest.fn(),
  stream: {
    getTracks: jest.fn().mockReturnValue([{ stop: jest.fn() }])
  }
};

// Mock the MediaRecorder constructor
const MediaRecorderMock = jest.fn().mockImplementation(() => mockMediaRecorder);
// Add the isTypeSupported static method with proper typing
(MediaRecorderMock as unknown as { isTypeSupported: jest.Mock }).isTypeSupported = jest.fn().mockReturnValue(true);

// Replace the window.MediaRecorder with our mock
Object.defineProperty(window, 'MediaRecorder', {
  writable: true,
  value: MediaRecorderMock
});

// Mock getUserMedia
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn().mockResolvedValue('mock-stream')
  },
  writable: true
});

// Mock URL.createObjectURL and URL.revokeObjectURL
URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
URL.revokeObjectURL = jest.fn();

// Mock fetch for API calls
global.fetch = jest.fn().mockImplementation((url) => {
  if (url === '/api/transcribe') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ transcript: 'This is a test transcript.' })
    });
  } else if (url === '/api/rag') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ answer: 'This is a test answer.' })
    });
  } else if (url === '/api/tts') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ audioContent: 'base64-audio-data' })
    });
  }
  return Promise.reject(new Error(`Unknown URL: ${url}`));
});

describe('AudioRecorder Component', () => {
  const mockOnTranscription = jest.fn();
  const mockOnAIResponse = jest.fn();
  const mockConversationId = 'test-conversation-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the record button initially', () => {
    render(
      <AudioRecorder
        onTranscription={mockOnTranscription}
        onAIResponse={mockOnAIResponse}
        conversationId={mockConversationId}
      />
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Click the button to start recording')).toBeInTheDocument();
  });

  it('starts recording when the record button is clicked', async () => {
    render(
      <AudioRecorder
        onTranscription={mockOnTranscription}
        onAIResponse={mockOnAIResponse}
        conversationId={mockConversationId}
      />
    );

    fireEvent.click(screen.getByRole('button'));

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
    
    await waitFor(() => {
      expect(MediaRecorderMock).toHaveBeenCalled();
      expect(mockMediaRecorder.start).toHaveBeenCalled();
      expect(screen.getByText('Recording... Click the button to stop')).toBeInTheDocument();
    });
  });

  it('stops recording and processes audio when stop button is clicked', async () => {
    render(
      <AudioRecorder
        onTranscription={mockOnTranscription}
        onAIResponse={mockOnAIResponse}
        conversationId={mockConversationId}
      />
    );

    // Start recording
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(mockMediaRecorder.start).toHaveBeenCalled();
    });

    // Stop recording
    fireEvent.click(screen.getByRole('button'));
    
    expect(mockMediaRecorder.stop).toHaveBeenCalled();
    expect(mockMediaRecorder.stream.getTracks).toHaveBeenCalled();
    
    await waitFor(() => {
      expect(screen.getByText('Processing your audio...')).toBeInTheDocument();
    });

    // Manually trigger the onstop handler
    const audioBlob = new Blob([], { type: 'audio/webm' });
    const dataAvailableEvent = { data: audioBlob };
    
    // @ts-ignore - We're mocking the event
    mockMediaRecorder.ondataavailable(dataAvailableEvent);
    
    // @ts-ignore - Calling the onstop handler directly
    await mockMediaRecorder.onstop();
    
    // Verify the API calls
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/transcribe', expect.any(Object));
      expect(global.fetch).toHaveBeenCalledWith('/api/rag', expect.any(Object));
      expect(global.fetch).toHaveBeenCalledWith('/api/tts', expect.any(Object));
      
      expect(mockOnTranscription).toHaveBeenCalledWith('This is a test transcript.');
      expect(mockOnAIResponse).toHaveBeenCalledWith('This is a test answer.', 'base64-audio-data');
    });
  });

  it('displays an error message when getUserMedia fails', async () => {
    // Mock getUserMedia to fail
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn().mockRejectedValue(new Error('Permission denied'))
      },
      writable: true
    });

    render(
      <AudioRecorder
        onTranscription={mockOnTranscription}
        onAIResponse={mockOnAIResponse}
        conversationId={mockConversationId}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(screen.getByText('Could not access microphone')).toBeInTheDocument();
    });
  });
}); 