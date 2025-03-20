import {
  createConversation,
  getConversationById,
  listConversations,
  createMessage
} from '@/lib/services/prisma';

// Mock Prisma client operations
const mockConversationCreate = jest.fn();
const mockConversationFindUnique = jest.fn();
const mockConversationFindMany = jest.fn();
const mockMessageCreate = jest.fn();
const mockMessageFindMany = jest.fn();

jest.mock('@/lib/services/prisma', () => {
  const original = jest.requireActual('@/lib/services/prisma');
  return {
    ...original,
    getPrismaClient: jest.fn().mockReturnValue({
      conversation: {
        create: mockConversationCreate,
        findUnique: mockConversationFindUnique,
        findMany: mockConversationFindMany,
      },
      message: {
        create: mockMessageCreate,
        findMany: mockMessageFindMany,
      }
    })
  };
});

describe('Conversation and Message Service Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createConversation function', () => {
    it('should create a new conversation', async () => {
      // Setup mock return
      const mockConversation = {
        id: 'conv-123',
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockConversationCreate.mockResolvedValue(mockConversation);

      // Call the function
      const result = await createConversation('user-123');

      // Verify the result
      expect(result).toEqual(mockConversation);

      // Verify the Prisma call
      expect(mockConversationCreate).toHaveBeenCalledWith({
        data: {
          userId: 'user-123'
        }
      });
    });

    it('should create a conversation without userId if not provided', async () => {
      // Setup mock return
      const mockConversation = {
        id: 'conv-456',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockConversationCreate.mockResolvedValue(mockConversation);

      // Call the function without userId
      const result = await createConversation();

      // Verify the result
      expect(result).toEqual(mockConversation);

      // Verify the Prisma call
      expect(mockConversationCreate).toHaveBeenCalledWith({
        data: {}
      });
    });

    it('should create a conversation with systemPromptId if provided', async () => {
      // Setup mock return
      const mockConversation = {
        id: 'conv-789',
        userId: 'user-123',
        systemPromptId: 'prompt-456',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockConversationCreate.mockResolvedValue(mockConversation);

      // Call the function with userId and systemPromptId
      const result = await createConversation('user-123', 'prompt-456');

      // Verify the result
      expect(result).toEqual(mockConversation);

      // Verify the Prisma call
      expect(mockConversationCreate).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          systemPromptId: 'prompt-456'
        }
      });
    });
  });

  describe('getConversationById function', () => {
    it('should retrieve a conversation by ID with messages', async () => {
      // Setup mock return
      const mockConversation = {
        id: 'conv-123',
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [
          {
            id: 'msg-1',
            conversationId: 'conv-123',
            role: 'user',
            content: 'Hello',
            createdAt: new Date()
          },
          {
            id: 'msg-2',
            conversationId: 'conv-123',
            role: 'assistant',
            content: 'Hi there',
            createdAt: new Date()
          }
        ]
      };
      mockConversationFindUnique.mockResolvedValue(mockConversation);

      // Call the function
      const result = await getConversationById('conv-123');

      // Verify the result
      expect(result).toEqual(mockConversation);

      // Verify the Prisma call
      expect(mockConversationFindUnique).toHaveBeenCalledWith({
        where: { id: 'conv-123' },
        include: { 
          messages: {
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      });
    });

    it('should return null for non-existent conversation', async () => {
      // Setup mock return
      mockConversationFindUnique.mockResolvedValue(null);

      // Call the function
      const result = await getConversationById('non-existent-id');

      // Verify the result
      expect(result).toBeNull();
    });
  });

  describe('listConversations function', () => {
    it('should list conversations for a user', async () => {
      // Setup mock return
      const mockConversations = [
        {
          id: 'conv-123',
          userId: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'conv-456',
          userId: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      mockConversationFindMany.mockResolvedValue(mockConversations);

      // Call the function
      const result = await listConversations('user-123');

      // Verify the result
      expect(result).toEqual(mockConversations);

      // Verify the Prisma call
      expect(mockConversationFindMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        include: {
          _count: {
            select: { messages: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 10
      });
    });

    it('should list all conversations if no userId is provided', async () => {
      // Setup mock return
      const mockConversations = [
        {
          id: 'conv-123',
          userId: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'conv-456',
          userId: 'user-456',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      mockConversationFindMany.mockResolvedValue(mockConversations);

      // Call the function without userId
      const result = await listConversations();

      // Verify the result
      expect(result).toEqual(mockConversations);

      // Verify the Prisma call - should not have a where clause
      expect(mockConversationFindMany).toHaveBeenCalledWith({
        include: {
          _count: {
            select: { messages: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 10
      });
    });

    it('should respect the limit parameter', async () => {
      // Call the function with a custom limit
      await listConversations('user-123', 50);

      // Verify the Prisma call includes the custom limit
      expect(mockConversationFindMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        include: {
          _count: {
            select: { messages: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 50
      });
    });
  });

  describe('createMessage function', () => {
    it('should create a new message', async () => {
      // Setup mock return
      const mockMessage = {
        id: 'msg-123',
        conversationId: 'conv-123',
        role: 'user',
        content: 'Hello',
        createdAt: new Date()
      };
      mockMessageCreate.mockResolvedValue(mockMessage);

      // Call the function
      const result = await createMessage({
        conversationId: 'conv-123',
        role: 'user',
        content: 'Hello'
      });

      // Verify the result
      expect(result).toEqual(mockMessage);

      // Verify the Prisma call
      expect(mockMessageCreate).toHaveBeenCalledWith({
        data: {
          conversationId: 'conv-123',
          role: 'user',
          content: 'Hello'
        }
      });
    });
  });
}); 