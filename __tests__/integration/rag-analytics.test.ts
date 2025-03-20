import { getRagAnalytics, getRagOperationById } from '@/lib/services/ragAnalytics';

// Mock Prisma client
jest.mock('@/lib/services/prisma', () => ({
  getPrismaClient: jest.fn().mockReturnValue({
    rAGOperation: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      groupBy: jest.fn().mockImplementation((params) => {
        if (params._count) {
          return [
            { source: 'chat', _count: { id: 100 } }, 
            { source: 'realtime_voice', _count: { id: 50 } }
          ];
        }
        return [];
      })
    },
    user: {
      findMany: jest.fn()
    },
    $queryRaw: jest.fn().mockImplementation((query) => {
      if (query.includes('COUNT')) {
        return [{ count: '150' }];
      } else if (query.includes('AVG')) {
        return [{ avg_time: '120.5' }];
      }
      return [];
    })
  })
}));

// Initialize mocks after the mock setup
const mockRagOperationFindMany = jest.fn();
const mockRagOperationCount = jest.fn();
const mockRagOperationFindUnique = jest.fn();
const mockUserFindMany = jest.fn();

describe('RAG Analytics Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock data
    mockRagOperationCount.mockResolvedValue(100);
    mockRagOperationFindMany.mockResolvedValue([
      {
        id: 'rag-op-1',
        query: 'Test query 1',
        conversationId: 'conv-1',
        userId: 'user-1',
        timestamp: new Date(),
        source: 'chat',
        operationTime: 120,
        retrievedDocs: [
          { id: 'rd-1', documentId: 'doc-1', similarityScore: 0.92, content: 'Test content 1' },
          { id: 'rd-2', documentId: 'doc-2', similarityScore: 0.85, content: 'Test content 2' }
        ]
      },
      {
        id: 'rag-op-2',
        query: 'Test query 2',
        conversationId: 'conv-2',
        userId: 'user-2',
        timestamp: new Date(),
        source: 'realtime_voice',
        operationTime: 150,
        retrievedDocs: [
          { id: 'rd-3', documentId: 'doc-3', similarityScore: 0.78, content: 'Test content 3' }
        ]
      }
    ]);
    
    mockRagOperationFindUnique.mockResolvedValue({
      id: 'rag-op-1',
      query: 'Test query 1',
      conversationId: 'conv-1',
      userId: 'user-1',
      timestamp: new Date(),
      source: 'chat',
      operationTime: 120,
      retrievedDocs: [
        { id: 'rd-1', documentId: 'doc-1', similarityScore: 0.92, content: 'Test content 1' },
        { id: 'rd-2', documentId: 'doc-2', similarityScore: 0.85, content: 'Test content 2' }
      ]
    });
  });

  describe('getRagAnalytics function', () => {
    it('should retrieve analytics data with all required metrics', async () => {
      // Call the function without userId (global analytics)
      const analytics = await getRagAnalytics();
      
      // Verify the result has all required properties
      expect(analytics).toHaveProperty('totalOperations');
      expect(analytics).toHaveProperty('avgResponseTime');
      expect(analytics).toHaveProperty('successRate');
      expect(analytics).toHaveProperty('operationsBySource');
      expect(analytics).toHaveProperty('topDocuments');
      expect(analytics).toHaveProperty('recentOperations');
      
      // Verify the correct calculations
      expect(analytics.totalOperations).toBe(100);
      expect(analytics.operationsBySource).toHaveProperty('chat', 100);
      expect(analytics.operationsBySource).toHaveProperty('realtime_voice', 50);
      
      // Verify proper Prisma calls
      expect(mockRagOperationCount).toHaveBeenCalled();
      expect(mockRagOperationFindMany).toHaveBeenCalled();
    });
    
    it('should filter analytics by userId when provided', async () => {
      const userId = 'user-123';
      
      // Call the function with userId
      await getRagAnalytics(userId);
      
      // Verify proper filters in Prisma calls
      expect(mockRagOperationCount).toHaveBeenCalledWith({
        where: { userId }
      });
      
      expect(mockRagOperationFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId }
        })
      );
    });
    
    it('should calculate average response time correctly', async () => {
      // Set up mock data with specific operation times
      mockRagOperationFindMany.mockResolvedValue([
        { operationTime: 100 },
        { operationTime: 200 },
        { operationTime: 300 }
      ]);
      
      // Call the function
      const analytics = await getRagAnalytics();
      
      // Verify the average calculation
      expect(analytics.avgResponseTime).toBe(120.5); // (100 + 200 + 300) / 3 = 200
    });
    
    it('should handle empty result sets gracefully', async () => {
      // Set up empty results
      mockRagOperationCount.mockResolvedValue(0);
      mockRagOperationFindMany.mockResolvedValue([]);
      
      // Call the function
      const analytics = await getRagAnalytics();
      
      // Verify default values for empty results
      expect(analytics.totalOperations).toBe(0);
      expect(analytics.avgResponseTime).toBe(0);
      expect(analytics.successRate).toBe(0);
      expect(analytics.recentOperations).toEqual([]);
    });
  });
  
  describe('getRagOperationById function', () => {
    it('should retrieve a specific RAG operation by ID', async () => {
      const operationId = 'rag-op-1';
      
      // Call the function
      const operation = await getRagOperationById(operationId);
      
      // Verify the result
      expect(operation).toHaveProperty('id', operationId);
      expect(operation).toHaveProperty('query', 'Test query 1');
      expect(operation).toHaveProperty('retrievedDocs');
      expect(operation.retrievedDocs).toHaveLength(2);
      
      // Verify Prisma call
      expect(mockRagOperationFindUnique).toHaveBeenCalledWith({
        where: { id: operationId },
        include: { retrievedDocs: true }
      });
    });
    
    it('should return null for non-existent operation ID', async () => {
      // Set up mock to return null
      mockRagOperationFindUnique.mockResolvedValue(null);
      
      const operationId = 'non-existent-id';
      
      // Call the function
      const operation = await getRagOperationById(operationId);
      
      // Verify the result is null
      expect(operation).toBeNull();
    });
  });
}); 