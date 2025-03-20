import { createMessageFeedback, getMessageFeedback, updateMessageFeedback } from '@/lib/services/feedbackService';

// Mock Prisma client
jest.mock('@/lib/services/prisma', () => {
  const mockFeedbackCreate = jest.fn();
  const mockFeedbackFindUnique = jest.fn();
  const mockFeedbackUpdate = jest.fn();
  
  // Export the mocks so they can be accessed in tests
  (global as any).mockFeedbackCreate = mockFeedbackCreate;
  (global as any).mockFeedbackFindUnique = mockFeedbackFindUnique;
  (global as any).mockFeedbackUpdate = mockFeedbackUpdate;
  
  return {
    getPrismaClient: jest.fn().mockReturnValue({
      messageFeedback: {
        create: mockFeedbackCreate,
        findUnique: mockFeedbackFindUnique,
        update: mockFeedbackUpdate,
      }
    })
  };
});

// Initialize mocks from global exports
const mockFeedbackCreate = (global as any).mockFeedbackCreate;
const mockFeedbackFindUnique = (global as any).mockFeedbackFindUnique;
const mockFeedbackUpdate = (global as any).mockFeedbackUpdate;

describe('Message Feedback Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock returns
    mockFeedbackCreate.mockResolvedValue({
      id: 'feedback-123',
      messageId: 'msg-123',
      type: 'LIKE', 
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    mockFeedbackFindUnique.mockResolvedValue({
      id: 'feedback-123',
      messageId: 'msg-123',
      type: 'LIKE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    mockFeedbackUpdate.mockResolvedValue({
      id: 'feedback-123',
      messageId: 'msg-123',
      type: 'DISLIKE', // Updated type
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });
  
  describe('createMessageFeedback function', () => {
    it('should create new feedback for a message', async () => {
      // Call the function
      const result = await createMessageFeedback('msg-123', 'LIKE');
      
      // Verify the result
      expect(result).toHaveProperty('id', 'feedback-123');
      expect(result).toHaveProperty('messageId', 'msg-123');
      expect(result).toHaveProperty('type', 'LIKE');
      
      // Verify Prisma call
      expect(mockFeedbackCreate).toHaveBeenCalledWith({
        data: {
          messageId: 'msg-123',
          type: 'LIKE',
        }
      });
    });
    
    it('should validate feedback type', async () => {
      // Set up mock to throw error for invalid type
      mockFeedbackCreate.mockImplementation((args: { data: { messageId: string, type: string } }) => {
        const type = args.data.type;
        if (type !== 'LIKE' && type !== 'DISLIKE') {
          throw new Error('Invalid feedback type');
        }
        return {
          id: 'feedback-123',
          messageId: 'msg-123',
          type,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });
      
      // Test valid type
      await expect(createMessageFeedback('msg-123', 'LIKE')).resolves.toBeDefined();
      
      // Test invalid type
      await expect(createMessageFeedback('msg-123', 'INVALID' as any)).rejects.toThrow();
    });
  });
  
  describe('getMessageFeedback function', () => {
    it('should retrieve feedback for a message', async () => {
      // Call the function
      const result = await getMessageFeedback('msg-123');
      
      // Verify the result
      expect(result).toHaveProperty('id', 'feedback-123');
      expect(result).toHaveProperty('messageId', 'msg-123');
      
      // Verify Prisma call
      expect(mockFeedbackFindUnique).toHaveBeenCalledWith({
        where: {
          messageId: 'msg-123',
        }
      });
    });
    
    it('should return null if no feedback exists', async () => {
      // Set up mock to return null
      mockFeedbackFindUnique.mockResolvedValue(null);
      
      // Call the function
      const result = await getMessageFeedback('msg-456');
      
      // Verify the result is null
      expect(result).toBeNull();
    });
  });
  
  describe('updateMessageFeedback function', () => {
    it('should update existing feedback', async () => {
      // Call the function
      const result = await updateMessageFeedback('msg-123', 'DISLIKE');
      
      // Verify the result
      expect(result).toHaveProperty('id', 'feedback-123');
      expect(result).toHaveProperty('type', 'DISLIKE');
      
      // Verify Prisma call
      expect(mockFeedbackUpdate).toHaveBeenCalledWith({
        where: {
          messageId: 'msg-123',
        },
        data: {
          type: 'DISLIKE',
        }
      });
    });
    
    it('should create feedback if it doesn\'t exist', async () => {
      // Set up mock to return null for find
      mockFeedbackFindUnique.mockResolvedValue(null);
      
      // Call the function
      await updateMessageFeedback('msg-456', 'LIKE');
      
      // Verify createMessageFeedback was called
      expect(mockFeedbackCreate).toHaveBeenCalledWith({
        data: {
          messageId: 'msg-456',
          type: 'LIKE',
        }
      });
    });
  });
}); 