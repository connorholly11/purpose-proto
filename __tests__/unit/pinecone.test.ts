import { getPineconeClient, queryDocuments, upsertDocuments } from '@/lib/services/pinecone';
import { generateEmbedding } from '@/lib/services/openai';

// Mock the Pinecone module
jest.mock('@pinecone-database/pinecone', () => {
  const mockIndex = {
    upsert: jest.fn().mockResolvedValue({ upsertedCount: 1 }),
    query: jest.fn().mockResolvedValue({
      matches: [
        {
          id: 'doc-1',
          score: 0.9,
          metadata: { text: 'Sample document text 1' }
        },
        {
          id: 'doc-2',
          score: 0.8,
          metadata: { text: 'Sample document text 2' }
        }
      ]
    })
  };

  return {
    Pinecone: jest.fn().mockImplementation(() => ({
      index: jest.fn().mockReturnValue(mockIndex)
    }))
  };
});

// Mock the OpenAI embedding generation
jest.mock('@/lib/services/openai', () => ({
  generateEmbedding: jest.fn().mockResolvedValue([0.1, 0.2, 0.3])
}));

// Mock user knowledge items
jest.mock('@/lib/services/knowledgeService', () => ({
  getUserKnowledgeItems: jest.fn().mockResolvedValue([
    {
      id: 'knowledge-1',
      title: 'User Knowledge 1',
      content: 'This is some user-specific knowledge'
    }
  ])
}));

describe('Pinecone Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the singleton instance before each test
    (getPineconeClient as any).__instance = null;
    
    // Set up environment variables
    process.env.PINECONE_API_KEY = 'test-pinecone-key';
    process.env.PINECONE_HOST = 'test-pinecone-host';
    process.env.PINECONE_INDEX = 'test-index';
  });

  describe('getPineconeClient', () => {
    it('should create a new Pinecone client with the API key', () => {
      const client = getPineconeClient();
      expect(client).toBeDefined();
      expect(client.index).toBeDefined();
    });

    it('should throw an error if API key or host is not defined', () => {
      delete process.env.PINECONE_API_KEY;
      expect(() => getPineconeClient()).toThrow('PINECONE_API_KEY or PINECONE_HOST is not defined in environment variables');
    });
  });

  describe('upsertDocuments', () => {
    it('should generate embeddings and upsert documents', async () => {
      const documents = [
        { text: 'Document 1', source: 'source1', userId: 'user1' },
        { text: 'Document 2', source: 'source2' }
      ];

      const client = getPineconeClient();
      const indexInstance = client.index(process.env.PINECONE_INDEX!);
      
      await upsertDocuments(documents);
      
      // Check that generateEmbedding was called for each document
      expect(generateEmbedding).toHaveBeenCalledTimes(2);
      expect(generateEmbedding).toHaveBeenNthCalledWith(1, 'Document 1');
      expect(generateEmbedding).toHaveBeenNthCalledWith(2, 'Document 2');
      
      // Check that upsert was called with correct vectors
      expect(indexInstance.upsert).toHaveBeenCalledTimes(1);
      expect(indexInstance.upsert).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          values: [0.1, 0.2, 0.3],
          metadata: { text: 'Document 1', source: 'source1', userId: 'user1' }
        }),
        expect.objectContaining({
          values: [0.1, 0.2, 0.3],
          metadata: { text: 'Document 2', source: 'source2' }
        })
      ]));
    });

    it('should throw an error if PINECONE_INDEX is not defined', async () => {
      delete process.env.PINECONE_INDEX;
      await expect(upsertDocuments([{ text: 'Test', source: 'source' }]))
        .rejects.toThrow('PINECONE_INDEX is not defined in environment variables');
    });
  });

  describe('queryDocuments', () => {
    it('should generate embedding and query Pinecone', async () => {
      const query = 'Test query';
      const client = getPineconeClient();
      const indexInstance = client.index(process.env.PINECONE_INDEX!);
      
      const result = await queryDocuments(query);
      
      // Check that generateEmbedding was called with the query
      expect(generateEmbedding).toHaveBeenCalledWith(query);
      
      // Check that query was called with correct parameters
      expect(indexInstance.query).toHaveBeenCalledWith({
        vector: [0.1, 0.2, 0.3],
        topK: 5,
        includeMetadata: true,
        filter: undefined
      });
      
      // Check that the result is correctly formatted
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({
        id: 'doc-1',
        score: 0.9,
        content: 'Sample document text 1'
      }));
      expect(result[1]).toEqual(expect.objectContaining({
        id: 'doc-2',
        score: 0.8,
        content: 'Sample document text 2'
      }));
    });

    it('should use the provided topK parameter', async () => {
      const query = 'Test query';
      const topK = 10;
      const client = getPineconeClient();
      const indexInstance = client.index(process.env.PINECONE_INDEX!);
      
      await queryDocuments(query, topK);
      
      expect(indexInstance.query).toHaveBeenCalledWith({
        vector: [0.1, 0.2, 0.3],
        topK,
        includeMetadata: true,
        filter: undefined
      });
    });

    it('should include additionalContext in the query embedding generation', async () => {
      const query = 'Test query';
      const additionalContext = 'Additional context for embedding';
      
      await queryDocuments(query, 5, undefined, additionalContext);
      
      // Check that generateEmbedding was called with the combined query
      expect(generateEmbedding).toHaveBeenCalledWith('Test query Additional context for embedding');
    });

    it('should include user knowledge when userId is provided', async () => {
      const query = 'Test query';
      const userId = 'user1';
      const { getUserKnowledgeItems } = require('@/lib/services/knowledgeService');
      
      const result = await queryDocuments(query, 5, userId);
      
      // Check that getUserKnowledgeItems was called with the userId
      expect(getUserKnowledgeItems).toHaveBeenCalledWith(userId);
      
      // The result should include both Pinecone matches and user knowledge
      expect(result.length).toBeGreaterThan(0);
    });

    it('should throw an error if PINECONE_INDEX is not defined', async () => {
      delete process.env.PINECONE_INDEX;
      await expect(queryDocuments('Test query'))
        .rejects.toThrow('PINECONE_INDEX is not defined in environment variables');
    });
  });
}); 