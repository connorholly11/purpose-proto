import { queryDocuments, queryDocumentsOld } from '@/lib/services/pinecone';
import { generateEmbedding } from '@/lib/services/openai';
import { getUserKnowledgeItems } from '@/lib/services/knowledgeService';

// Mock the dependencies
jest.mock('@/lib/services/openai', () => ({
  generateEmbedding: jest.fn(),
}));

jest.mock('@/lib/services/knowledgeService', () => ({
  getUserKnowledgeItems: jest.fn(),
}));

// Mock the Pinecone index
const mockQuery = jest.fn();
jest.mock('@pinecone-database/pinecone', () => {
  return {
    Pinecone: jest.fn().mockImplementation(() => {
      return {
        index: jest.fn().mockReturnValue({
          query: mockQuery,
        }),
      };
    }),
  };
});

// Set environment variables for testing
process.env.PINECONE_API_KEY = 'test-api-key';
process.env.PINECONE_HOST = 'test-host';
process.env.PINECONE_INDEX = 'test-index';

describe('RAG Service Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default mock returns
    (generateEmbedding as jest.Mock).mockResolvedValue([0.1, 0.2, 0.3]); // Simple mock embedding
    mockQuery.mockResolvedValue({
      matches: [
        {
          id: 'doc-1',
          score: 0.92,
          metadata: {
            text: 'This is test document 1',
            source: 'test-source',
          },
        },
        {
          id: 'doc-2',
          score: 0.85,
          metadata: {
            text: 'This is test document 2',
            source: 'test-source-2',
          },
        },
      ],
    });
    (getUserKnowledgeItems as jest.Mock).mockResolvedValue([]);
  });

  describe('queryDocuments function', () => {
    it('should properly query Pinecone and return formatted results', async () => {
      const query = 'test query';
      const results = await queryDocuments(query);

      // Verify embeddings were generated
      expect(generateEmbedding).toHaveBeenCalledWith(query);
      
      // Verify Pinecone was queried with the right parameters
      expect(mockQuery).toHaveBeenCalledWith({
        vector: [0.1, 0.2, 0.3],
        topK: 5,
        includeMetadata: true,
        filter: undefined
      });
      
      // Verify the results are properly formatted
      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        id: 'doc-1',
        score: 0.92,
        content: 'This is test document 1',
      });
    });

    it('should incorporate user knowledge items when userId is provided', async () => {
      // Mock user knowledge items
      const userKnowledgeItems = [
        {
          id: 'knowledge-1',
          content: 'User-specific knowledge',
          title: 'Knowledge Title',
        },
      ];
      (getUserKnowledgeItems as jest.Mock).mockResolvedValue(userKnowledgeItems);
      
      // Mock the second embedding for the knowledge item
      (generateEmbedding as jest.Mock)
        .mockResolvedValueOnce([0.1, 0.2, 0.3]) // For the query
        .mockResolvedValueOnce([0.2, 0.3, 0.4]); // For the knowledge item
      
      const query = 'test query with user';
      const results = await queryDocuments(query, 5, 'user-123');
      
      // Verify embeddings were generated for both query and knowledge item
      expect(generateEmbedding).toHaveBeenCalledTimes(2);
      expect(getUserKnowledgeItems).toHaveBeenCalledWith('user-123');
      
      // We should have results from both Pinecone and user knowledge
      // Note: Since the cosine similarity calculation in the test will always be > 0.7,
      // we expect the knowledge item to be included
      expect(results.length).toBeGreaterThan(0);
    });

    it('should use additionalContext when provided', async () => {
      const query = 'test query';
      const additionalContext = 'additional search context';
      
      await queryDocuments(query, 5, undefined, additionalContext);
      
      // Verify the combined query was used for embedding generation
      expect(generateEmbedding).toHaveBeenCalledWith('test query additional search context');
    });
  });

  describe('queryDocumentsOld function', () => {
    it('should return context and matches with proper formatting', async () => {
      // Mock the Prisma client transaction
      jest.mock('@/lib/services/prisma', () => ({
        getPrismaClient: jest.fn().mockReturnValue({
          $transaction: jest.fn().mockImplementation(callback => callback({
            embedding: {
              create: jest.fn().mockResolvedValue({ id: 'embed-123' }),
            },
            RAGOperation: {
              create: jest.fn().mockResolvedValue({ id: 'rag-op-123' }),
            },
          })),
        }),
      }));

      const query = 'old test query';
      const result = await queryDocumentsOld(query, 3, 'test', 'conv-123');
      
      // Verify proper structure of the response
      expect(result).toHaveProperty('context');
      expect(result).toHaveProperty('matches');
      expect(result).toHaveProperty('operationTime');
      expect(result).toHaveProperty('requestId');
      
      // Verify context contains the combined text
      expect(result.context).toEqual(expect.stringContaining('This is test document 1'));
      expect(result.context).toEqual(expect.stringContaining('This is test document 2'));
      
      // Verify matches are properly formatted
      expect(result.matches).toHaveLength(2);
      expect(result.matches[0]).toMatchObject({
        id: 'doc-1',
        score: 0.92,
        text: 'This is test document 1',
        source: 'test-source',
      });
    });
  });
}); 