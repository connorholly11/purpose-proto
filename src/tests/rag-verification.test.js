const { queryDocuments, queryDocumentsOld } = require('../lib/services/pinecone');
const { createConversation, createMessage, getPrismaClient } = require('../lib/services/prisma');

/**
 * RAG System Verification Tests
 * 
 * This test suite verifies:
 * 1. Embeddings can be generated from query text
 * 2. Pinecone can be queried with those embeddings
 * 3. RAG operations are logged to the database
 */

// Mock conversation for testing
let testConversationId = null;

beforeAll(async () => {
  // Create a test conversation to use for testing
  const conversation = await createConversation();
  testConversationId = conversation.id;
  
  console.log(`Created test conversation with ID: ${testConversationId}`);
});

afterAll(async () => {
  // Clean up the test conversation
  const prisma = getPrismaClient();
  try {
    // Delete retrieved documents first to handle foreign key constraints
    await prisma.$executeRaw`DELETE FROM "RetrievedDocument" 
      WHERE "ragOperationId" IN (
        SELECT id FROM "RAGOperation" WHERE "conversationId" = ${testConversationId}
      )`;
    
    // Then delete RAG operations
    await prisma.$executeRaw`DELETE FROM "RAGOperation" WHERE "conversationId" = ${testConversationId}`;
    
    // Delete messages and conversation
    await prisma.$executeRaw`DELETE FROM "Message" WHERE "conversationId" = ${testConversationId}`;
    await prisma.$executeRaw`DELETE FROM "Conversation" WHERE "id" = ${testConversationId}`;
    
    console.log('Test cleanup complete');
  } catch (error) {
    console.error('Error during test cleanup:', error);
  }
});

describe('RAG System Verification', () => {
  test('Test embedding generation, Pinecone query, and RAG logging', async () => {
    // Define test queries
    const testQueries = [
      'What is machine learning?',
      'How does a neural network work?',
      'Tell me about large language models'
    ];
    
    for (const query of testQueries) {
      console.log(`Testing query: "${query}"`);
      
      // Use the queryDocuments function to perform RAG - directly returns matches now
      const matches = await queryDocuments(
        query,                 // Query text
        5,                     // Top K results
        testConversationId,    // User ID (using conversation ID for testing)
        "Test additional context" // Additional context
      );
      
      // Verify the result has expected shape
      expect(Array.isArray(matches)).toBe(true);
      
      console.log(`Number of matches found: ${matches.length}`);
      
      // Check some matches were returned (if your vector DB has content)
      if (matches.length > 0) {
        console.log('Top match score:', matches[0].score);
        // First 50 chars of matched content
        console.log('Sample content:', matches[0].content.substring(0, 50) + '...');
      }
      
      // For backward compatibility testing, we can also test the old function
      if (typeof queryDocumentsOld === 'function') {
        const oldResult = await queryDocumentsOld(
          query,                 // Query text
          5,                     // Top K results
          'test',                // Source
          testConversationId     // Conversation ID for logging
        );
        
        // Verify the old result format
        expect(oldResult).toHaveProperty('context');
        expect(oldResult).toHaveProperty('matches');
        expect(oldResult).toHaveProperty('operationTime');
        
        console.log(`Old API - Query execution time: ${oldResult.operationTime}ms`);
      }
      
      // Verify the operation was logged to the database
      const prisma = getPrismaClient();
      const operations = await prisma.$queryRaw`
        SELECT * FROM "RAGOperation" 
        WHERE "query" = ${query} AND "conversationId" = ${testConversationId}
        ORDER BY "timestamp" DESC
        LIMIT 1
      `;
      
      // There should be at least one logged operation for this query
      expect(Array.isArray(operations)).toBe(true);
      expect(operations.length).toBeGreaterThan(0);
      
      const operation = operations[0];
      expect(operation.query).toBe(query);
      expect(operation.conversationId).toBe(testConversationId);
      
      // Check if retrieved documents were logged
      const retrievedDocs = await prisma.$queryRaw`
        SELECT * FROM "RetrievedDocument"
        WHERE "ragOperationId" = ${operation.id}
      `;
      
      expect(Array.isArray(retrievedDocs)).toBe(true);
      console.log(`Retrieved documents logged: ${retrievedDocs.length}`);
      
      // Add a small delay between queries to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }, 30000); // 30 second timeout for the entire test
}); 