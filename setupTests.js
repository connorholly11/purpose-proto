/**
 * Jest setup file for backend/integration tests
 * 
 * This file runs before each test file
 */

// Load environment variables from .env.test
require('dotenv').config({ path: './__tests__/.env.test' });

// Increase timeout for all tests
jest.setTimeout(30000);

// Global setup for tests
beforeAll(() => {
  console.log('Setting up test environment');
  
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Ensure environment variables are loaded or provide mocks
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️ OPENAI_API_KEY is not set in environment, using mock value');
    process.env.OPENAI_API_KEY = 'sk-mock-openai-key-for-testing';
  }
  
  if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX || !process.env.PINECONE_HOST) {
    console.warn('⚠️ Pinecone environment variables are not set, using mock values');
    process.env.PINECONE_API_KEY = 'mock-pinecone-key';
    process.env.PINECONE_INDEX = 'mock-index';
    process.env.PINECONE_HOST = 'mock-host';
  }
  
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL is not set in environment, using mock value');
    process.env.DATABASE_URL = 'postgresql://mock:mock@localhost:5432/mockdb';
  }

  // Create temp directory for tests if it doesn't exist
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  const tempDir = path.join(os.tmpdir(), 'purpose-test');
  
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Set the temp directory for tests
  process.env.TEST_TEMP_DIR = tempDir;
  console.log(`Created test temp directory at: ${tempDir}`);
});

// Global cleanup after all tests
afterAll(() => {
  console.log('Cleaning up test environment');
}); 