import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Message from '@/app/components/Message';
import { Message as MessageType } from '@/types';

describe('Message Component', () => {
  const mockUserMessage: MessageType = {
    id: 'user-message-id',
    conversationId: 'conversation-id',
    role: 'user',
    content: 'This is a user message',
    createdAt: new Date(),
  };

  const mockAIMessage: MessageType = {
    id: 'ai-message-id',
    conversationId: 'conversation-id',
    role: 'assistant',
    content: 'This is an AI response',
    createdAt: new Date(),
  };

  it('renders a user message correctly', () => {
    render(<Message message={mockUserMessage} />);
    
    // Verify the message content is displayed
    expect(screen.getByText('This is a user message')).toBeInTheDocument();
    
    // Verify the user label is displayed
    expect(screen.getByText('You')).toBeInTheDocument();
    
    // Like/dislike buttons should not be present for user messages
    expect(screen.queryByLabelText('Like message')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Dislike message')).not.toBeInTheDocument();
  });

  it('renders an AI message correctly', () => {
    render(<Message message={mockAIMessage} />);
    
    // Verify the message content is displayed
    expect(screen.getByText('This is an AI response')).toBeInTheDocument();
    
    // Verify the AI label is displayed
    expect(screen.getByText('AI')).toBeInTheDocument();
    
    // Like/dislike buttons should not be present by default
    expect(screen.queryByLabelText('Like message')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Dislike message')).not.toBeInTheDocument();
  });

  it('shows like/dislike buttons for AI messages when handlers are provided', () => {
    const mockLike = jest.fn();
    const mockDislike = jest.fn();
    
    render(
      <Message 
        message={mockAIMessage} 
        onLike={mockLike} 
        onDislike={mockDislike} 
      />
    );
    
    // Like/dislike buttons should be present
    const likeButton = screen.getByLabelText('Like message');
    const dislikeButton = screen.getByLabelText('Dislike message');
    
    expect(likeButton).toBeInTheDocument();
    expect(dislikeButton).toBeInTheDocument();
  });

  it('calls onLike when like button is clicked', () => {
    const mockLike = jest.fn();
    const mockDislike = jest.fn();
    
    render(
      <Message 
        message={mockAIMessage} 
        onLike={mockLike} 
        onDislike={mockDislike} 
      />
    );
    
    // Click the like button
    const likeButton = screen.getByLabelText('Like message');
    fireEvent.click(likeButton);
    
    // Verify the onLike handler was called
    expect(mockLike).toHaveBeenCalledTimes(1);
    expect(mockDislike).not.toHaveBeenCalled();
  });

  it('calls onDislike when dislike button is clicked', () => {
    const mockLike = jest.fn();
    const mockDislike = jest.fn();
    
    render(
      <Message 
        message={mockAIMessage} 
        onLike={mockLike} 
        onDislike={mockDislike} 
      />
    );
    
    // Click the dislike button
    const dislikeButton = screen.getByLabelText('Dislike message');
    fireEvent.click(dislikeButton);
    
    // Verify the onDislike handler was called
    expect(mockDislike).toHaveBeenCalledTimes(1);
    expect(mockLike).not.toHaveBeenCalled();
  });
}); 