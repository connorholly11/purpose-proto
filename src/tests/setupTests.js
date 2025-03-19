/**
 * Jest setup file
 * 
 * This file runs before each test file
 */

// Increase timeout for all tests
jest.setTimeout(30000);

// Global setup for tests
beforeAll(() => {
  console.log('Setting up test environment');
  
  // Ensure environment variables are loaded
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️ OPENAI_API_KEY is not set in environment');
  }
  
  if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX) {
    console.warn('⚠️ Pinecone environment variables are not set');
  }
  
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL is not set in environment');
  }
});

// Global cleanup after all tests
afterAll(() => {
  console.log('Cleaning up test environment');
}); 