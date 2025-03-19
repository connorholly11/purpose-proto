import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LogsPage from '@/app/logs/page';
import { getLogsForUser, rateResponse } from '@/services/api';

// Mock the API services
jest.mock('@/services/api', () => ({
  getLogsForUser: jest.fn(),
  rateResponse: jest.fn(),
}));

describe('LogsPage Component', () => {
  const mockLogs = [
    {
      id: 'log-1',
      userId: 'user-1',
      type: 'chat',
      data: {
        query: 'Hello, how are you?',
        response: 'I am doing well, thank you for asking!',
      },
      rating: null,
      createdAt: '2025-03-19T12:00:00Z',
    },
    {
      id: 'log-2',
      userId: 'user-1',
      type: 'chat',
      data: {
        query: 'What is the weather today?',
        response: 'I cannot check the current weather as I do not have access to real-time data.',
      },
      rating: true,
      createdAt: '2025-03-19T13:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (getLogsForUser as jest.Mock).mockResolvedValue(mockLogs);
    (rateResponse as jest.Mock).mockResolvedValue({ success: true });
  });

  it('renders the logs page correctly', async () => {
    await act(async () => {
      render(<LogsPage />);
    });
    
    // Check if loading state is displayed initially
    expect(screen.getByText('Loading logs...')).toBeInTheDocument();
    
    // Wait for logs to load
    await waitFor(() => {
      expect(screen.getByText('Conversation History')).toBeInTheDocument();
    });
    
    // Check if logs are displayed
    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
    expect(screen.getByText('I am doing well, thank you for asking!')).toBeInTheDocument();
    expect(screen.getByText('What is the weather today?')).toBeInTheDocument();
    expect(screen.getByText('I cannot check the current weather as I do not have access to real-time data.')).toBeInTheDocument();
  });

  it('allows users to rate responses', async () => {
    await act(async () => {
      render(<LogsPage />);
    });
    
    // Wait for logs to load
    await waitFor(() => {
      expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
    });
    
    // Find and click the thumbs up button for the first log
    const thumbsUpButtons = screen.getAllByText('👍 Yes');
    await act(async () => {
      fireEvent.click(thumbsUpButtons[0]);
    });
    
    // Check if API was called correctly
    expect(rateResponse).toHaveBeenCalledWith({
      id: 'log-1',
      rating: true,
    });
  });

  it('handles API errors gracefully', async () => {
    // Setup error case
    (getLogsForUser as jest.Mock).mockRejectedValue(new Error('API error'));
    
    await act(async () => {
      render(<LogsPage />);
    });
    
    // Wait for error message to be displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch logs. Please try again later.')).toBeInTheDocument();
    });
  });
});
