import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/message/[messageId]/feedback/route';

// Mock the getPrismaClient and Prisma client
jest.mock('@/lib/services/prisma', () => ({
  getPrismaClient: jest.fn()
}));

describe('Message Feedback API', () => {
  let mockRequest: Partial<NextRequest>;
  let mockParams: { params: { messageId: string } };
  let mockPrismaClient: any;

  beforeEach(() => {
    // Reset and setup mocks
    jest.clearAllMocks();
    
    // Mock request object
    mockRequest = {
      json: jest.fn()
    };
    
    // Setup params
    mockParams = {
      params: { messageId: 'test-message-id' }
    };
    
    // Setup Prisma client mock
    mockPrismaClient = {
      message: {
        findUnique: jest.fn()
      },
      messageFeedback: {
        upsert: jest.fn()
      }
    };
    
    // Set the return value for getPrismaClient
    const { getPrismaClient } = require('@/lib/services/prisma');
    getPrismaClient.mockReturnValue(mockPrismaClient);
  });

  it('returns 400 if feedback is invalid', async () => {
    // Setup
    mockRequest.json = jest.fn().mockResolvedValue({ feedback: 'invalid' });
    
    // Execute
    const response = await POST(
      mockRequest as NextRequest, 
      mockParams
    );
    
    // Assert
    expect(response.status).toBe(400);
    const responseBody = await response.json();
    expect(responseBody.error).toBe('Feedback must be either "like" or "dislike"');
  });

  it('returns 404 if message is not found', async () => {
    // Setup
    mockRequest.json = jest.fn().mockResolvedValue({ feedback: 'like' });
    mockPrismaClient.message.findUnique.mockResolvedValue(null);
    
    // Execute
    const response = await POST(
      mockRequest as NextRequest, 
      mockParams
    );
    
    // Assert
    expect(response.status).toBe(404);
    const responseBody = await response.json();
    expect(responseBody.error).toBe('Message not found');
  });

  it('creates new feedback if none exists', async () => {
    // Setup
    mockRequest.json = jest.fn().mockResolvedValue({ feedback: 'like' });
    mockPrismaClient.message.findUnique.mockResolvedValue({ 
      id: 'test-message-id',
      content: 'Test message'
    });
    mockPrismaClient.messageFeedback.upsert.mockResolvedValue({
      id: 'feedback-id',
      messageId: 'test-message-id',
      type: 'like'
    });
    
    // Execute
    const response = await POST(
      mockRequest as NextRequest, 
      mockParams
    );
    
    // Assert
    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
    expect(responseBody.feedback).toEqual({
      id: 'feedback-id',
      messageId: 'test-message-id',
      type: 'like'
    });
    
    // Verify upsert was called with correct parameters
    expect(mockPrismaClient.messageFeedback.upsert).toHaveBeenCalledWith({
      where: {
        messageId: 'test-message-id'
      },
      update: {
        type: 'like'
      },
      create: {
        messageId: 'test-message-id',
        type: 'like'
      }
    });
  });

  it('updates existing feedback if one exists', async () => {
    // Setup
    mockRequest.json = jest.fn().mockResolvedValue({ feedback: 'dislike' });
    mockPrismaClient.message.findUnique.mockResolvedValue({ 
      id: 'test-message-id',
      content: 'Test message'
    });
    mockPrismaClient.messageFeedback.upsert.mockResolvedValue({
      id: 'feedback-id',
      messageId: 'test-message-id',
      type: 'dislike'
    });
    
    // Execute
    const response = await POST(
      mockRequest as NextRequest, 
      mockParams
    );
    
    // Assert
    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
    expect(responseBody.feedback).toEqual({
      id: 'feedback-id',
      messageId: 'test-message-id',
      type: 'dislike'
    });
    
    // Verify upsert was called with correct parameters
    expect(mockPrismaClient.messageFeedback.upsert).toHaveBeenCalledWith({
      where: {
        messageId: 'test-message-id'
      },
      update: {
        type: 'dislike'
      },
      create: {
        messageId: 'test-message-id',
        type: 'dislike'
      }
    });
  });

  it('handles errors appropriately', async () => {
    // Setup
    mockRequest.json = jest.fn().mockResolvedValue({ feedback: 'like' });
    mockPrismaClient.message.findUnique.mockImplementation(() => {
      throw new Error('Database error');
    });
    
    // Mock console.error to prevent test output pollution
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Execute
    const response = await POST(
      mockRequest as NextRequest, 
      mockParams
    );
    
    // Assert
    expect(response.status).toBe(500);
    const responseBody = await response.json();
    expect(responseBody.error).toBe('Failed to process feedback');
    
    // Restore console.error
    console.error = originalConsoleError;
  });
}); 