const { queryDocuments, queryDocumentsOld } = require('../../src/lib/services/pinecone');
const { createConversation, createMessage, getPrismaClient } = require('../../src/lib/services/prisma');

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
    
    // Delete messages
    await prisma.$executeRaw`DELETE FROM "Message" WHERE "conversationId" = ${testConversationId}`;
    
    // Finally delete the conversation
    await prisma.$executeRaw`DELETE FROM "Conversation" WHERE id = ${testConversationId}`;
    
    console.log(`Cleaned up test conversation with ID: ${testConversationId}`);
  } catch (err) {
    console.error('Error cleaning up test data:', err);
  } finally {
    await prisma.$disconnect();
  }
});

describe('RAG System Verification', () => {
  it('should query Pinecone for documents using embeddings', async () => {
    // Create a test message
    const testQuery = "What is the purpose of this application?";
    const message = await createMessage({
      conversationId: testConversationId,
      content: testQuery,
      role: 'user'
    });
    
    expect(message).toBeTruthy();
    expect(message.id).toBeTruthy();
    
    // Query documents using the message content
    const results = await queryDocuments({
      query: testQuery,
      conversationId: testConversationId,
      messageId: message.id,
      limit: 5
    });
    
    // Verify we get results
    expect(results).toBeTruthy();
    expect(Array.isArray(results.documents)).toBe(true);
    console.log(`Found ${results.documents.length} documents matching the query`);
    
    // Verify metadata structure
    if (results.documents.length > 0) {
      const firstDoc = results.documents[0];
      expect(firstDoc).toHaveProperty('id');
      expect(firstDoc).toHaveProperty('text');
      expect(firstDoc).toHaveProperty('score');
      expect(firstDoc).toHaveProperty('metadata');
    }
    
    // Verify operation is logged
    const prisma = getPrismaClient();
    const ragOperations = await prisma.rAGOperation.findMany({
      where: {
        conversationId: testConversationId,
        messageId: message.id
      },
      include: {
        retrievedDocuments: true
      }
    });
    
    expect(ragOperations.length).toBeGreaterThan(0);
    
    // Check that documents were saved
    const firstOp = ragOperations[0];
    expect(firstOp).toHaveProperty('retrievedDocuments');
    expect(Array.isArray(firstOp.retrievedDocuments)).toBe(true);
    
    if (results.documents.length > 0) {
      expect(firstOp.retrievedDocuments.length).toBe(results.documents.length);
    }
    
    await prisma.$disconnect();
  });
}); 