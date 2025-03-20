import {
  createUserKnowledgeItem,
  getUserKnowledgeItems,
  getKnowledgeItemById,
  updateKnowledgeItem,
  deleteKnowledgeItem
} from '@/lib/services/knowledgeService';

// Mock Prisma client
const mockCreate = jest.fn();
const mockFindMany = jest.fn();
const mockFindUnique = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockTransaction = jest.fn(callback => {
  return callback({
    userKnowledgeItem: {
      create: mockCreate,
      findMany: mockFindMany,
      findUnique: mockFindUnique,
      update: mockUpdate,
      delete: mockDelete,
    }
  });
});

jest.mock('@/lib/services/prisma', () => ({
  getPrismaClient: jest.fn().mockReturnValue({
    $transaction: mockTransaction
  })
}));

describe('Knowledge Service Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUserKnowledgeItem function', () => {
    it('should create a new knowledge item for a user', async () => {
      // Setup mock return
      const mockKnowledgeItem = {
        id: 'knowledge-123',
        userId: 'user-123',
        content: 'Test content',
        title: 'Test title',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockCreate.mockResolvedValue(mockKnowledgeItem);

      // Call the function
      const userId = 'user-123';
      const content = 'Test content';
      const title = 'Test title';
      const result = await createUserKnowledgeItem(userId, content, title);

      // Verify the result
      expect(result).toEqual(mockKnowledgeItem);

      // Verify the Prisma call
      expect(mockTransaction).toHaveBeenCalled();
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          userId,
          content,
          title
        }
      });
    });
  });

  describe('getUserKnowledgeItems function', () => {
    it('should get all knowledge items for a user', async () => {
      // Setup mock return
      const mockKnowledgeItems = [
        {
          id: 'knowledge-123',
          userId: 'user-123',
          content: 'Test content 1',
          title: 'Test title 1',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'knowledge-456',
          userId: 'user-123',
          content: 'Test content 2',
          title: 'Test title 2',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      mockFindMany.mockResolvedValue(mockKnowledgeItems);

      // Call the function
      const userId = 'user-123';
      const result = await getUserKnowledgeItems(userId);

      // Verify the result
      expect(result).toEqual(mockKnowledgeItems);

      // Verify the Prisma call
      expect(mockTransaction).toHaveBeenCalled();
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('getKnowledgeItemById function', () => {
    it('should get a knowledge item by ID', async () => {
      // Setup mock return
      const mockKnowledgeItem = {
        id: 'knowledge-123',
        userId: 'user-123',
        content: 'Test content',
        title: 'Test title',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockFindUnique.mockResolvedValue(mockKnowledgeItem);

      // Call the function
      const id = 'knowledge-123';
      const result = await getKnowledgeItemById(id);

      // Verify the result
      expect(result).toEqual(mockKnowledgeItem);

      // Verify the Prisma call
      expect(mockTransaction).toHaveBeenCalled();
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id }
      });
    });

    it('should return null for non-existent item', async () => {
      // Setup mock return
      mockFindUnique.mockResolvedValue(null);

      // Call the function
      const id = 'non-existent-id';
      const result = await getKnowledgeItemById(id);

      // Verify the result
      expect(result).toBeNull();
    });
  });

  describe('updateKnowledgeItem function', () => {
    it('should update a knowledge item', async () => {
      // Setup mock return
      const mockUpdatedItem = {
        id: 'knowledge-123',
        userId: 'user-123',
        content: 'Updated content',
        title: 'Updated title',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockUpdate.mockResolvedValue(mockUpdatedItem);

      // Call the function
      const id = 'knowledge-123';
      const data = { content: 'Updated content', title: 'Updated title' };
      const result = await updateKnowledgeItem(id, data);

      // Verify the result
      expect(result).toEqual(mockUpdatedItem);

      // Verify the Prisma call
      expect(mockTransaction).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id },
        data
      });
    });
  });

  describe('deleteKnowledgeItem function', () => {
    it('should delete a knowledge item', async () => {
      // Setup mock return
      mockDelete.mockResolvedValue({});

      // Call the function
      const id = 'knowledge-123';
      await deleteKnowledgeItem(id);

      // Verify the Prisma call
      expect(mockTransaction).toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalledWith({
        where: { id }
      });
    });
  });
}); 