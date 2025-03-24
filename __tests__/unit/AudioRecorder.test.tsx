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
      json: () => Promise.resolve({ text: 'This is a test transcript.' })
    });
  } else if (url === '/api/rag') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ answer: 'This is a test answer.' })
    });
  }
  return Promise.reject(new Error(`Unknown URL: ${url}`));
});

describe('AudioRecorder Component', () => {
  const mockOnTranscription = jest.fn();
  const mockOnRecordingStateChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the record button initially', () => {
    render(
      <AudioRecorder 
        onTranscription={mockOnTranscription}
        onRecordingStateChange={mockOnRecordingStateChange}
      />
    );
    
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByLabelText('Start recording')).toBeInTheDocument();
  });

  it('starts recording when the button is clicked', async () => {
    render(
      <AudioRecorder 
        onTranscription={mockOnTranscription}
        onRecordingStateChange={mockOnRecordingStateChange}
      />
    );
    
    // Click to start recording
    fireEvent.click(screen.getByRole('button'));
    
    // Verify that MediaRecorder was called
    await waitFor(() => {
      expect(MediaRecorderMock).toHaveBeenCalledTimes(1);
      expect(mockMediaRecorder.start).toHaveBeenCalledTimes(1);
      expect(mockOnRecordingStateChange).toHaveBeenCalledWith(true);
    });
    
    // Should now show Stop recording button
    expect(screen.getByLabelText('Stop recording')).toBeInTheDocument();
  });

  it('stops recording and processes audio when stop button is clicked', async () => {
    render(
      <AudioRecorder 
        onTranscription={mockOnTranscription}
        onRecordingStateChange={mockOnRecordingStateChange}
      />
    );
    
    // Click to start recording
    fireEvent.click(screen.getByRole('button'));
    
    // Click to stop recording
    fireEvent.click(screen.getByRole('button'));
    
    // Verify MediaRecorder stop was called
    expect(mockMediaRecorder.stop).toHaveBeenCalledTimes(1);
    expect(mockOnRecordingStateChange).toHaveBeenCalledWith(false);
    
    // Simulate ondataavailable event
    const dataEvent = { data: new Blob(['audio data']) };
    mockMediaRecorder.ondataavailable(dataEvent);
    
    // Simulate the onstop event
    mockMediaRecorder.onstop();
    
    // Verify API calls
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/transcribe', expect.any(Object));
      expect(mockOnTranscription).toHaveBeenCalledWith('This is a test transcript.');
    });
  });

  it('handles errors in getUserMedia', async () => {
    // Mock getUserMedia to reject
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn().mockRejectedValue(new Error('Permission denied'))
      }
    });
    
    render(
      <AudioRecorder 
        onTranscription={mockOnTranscription}
        onRecordingStateChange={mockOnRecordingStateChange}
      />
    );
    
    // Click to start recording
    fireEvent.click(screen.getByRole('button'));
    
    // Should show an error message
    await waitFor(() => {
      expect(screen.getByText(/Could not access microphone/)).toBeInTheDocument();
    });
  });
}); 