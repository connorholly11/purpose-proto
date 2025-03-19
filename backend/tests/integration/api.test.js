/**
 * Integration tests for API endpoints
 */

const request = require('supertest');
const express = require('express');
const app = express(); // We'll mock the actual app for testing

// Mock the database service
jest.mock('../../services/database', () => ({
  users: {
    getOrCreate: jest.fn().mockResolvedValue({ id: 'test-user-1', name: 'Test User' }),
    count: jest.fn().mockResolvedValue(3)
  },
  conversations: {
    create: jest.fn().mockResolvedValue({ id: 'test-conv-1', title: 'Test Conversation' }),
    getByUser: jest.fn().mockResolvedValue([{ id: 'test-conv-1', title: 'Test Conversation' }]),
    getById: jest.fn().mockResolvedValue({ id: 'test-conv-1', title: 'Test Conversation' }),
    count: jest.fn().mockResolvedValue(5),
    countByUser: jest.fn().mockResolvedValue(2)
  },
  messages: {
    create: jest.fn().mockImplementation((data) => Promise.resolve({ 
      id: 'test-msg-1', 
      ...data, 
      createdAt: new Date() 
    })),
    getByConversation: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(25)
  },
  logs: {
    create: jest.fn().mockResolvedValue({ id: 'test-log-1' }),
    getByType: jest.fn().mockResolvedValue([]),
    getByTypeWithLimit: jest.fn().mockResolvedValue([]),
    getAll: jest.fn().mockResolvedValue([])
  },
  vectors: {
    create: jest.fn().mockResolvedValue({ id: 'test-vector-1' })
  }
}));

// Mock the RAG service
jest.mock('../../services/rag', () => ({
  generateResponse: jest.fn().mockResolvedValue({
    response: 'This is a test response from the RAG service',
    model: 'gpt-4o',
    contextUsed: []
  }),
  indexText: jest.fn().mockResolvedValue({ id: 'test-vector-1' }),
  addDocument: jest.fn().mockResolvedValue({ id: 'test-doc-1' })
}));

// Mock the OpenAI service
jest.mock('../../services/openai', () => ({
  textToSpeech: jest.fn().mockResolvedValue(Buffer.from('mock audio data')),
  speechToText: jest.fn().mockResolvedValue('Transcribed text from audio')
}));

// Import server.js but with mocks in place
let server;
describe('API Endpoints', () => {
  beforeAll(async () => {
    // This is a simplified approach - in a real test, we might need to mock more dependencies
    // or use a test database
    jest.mock('fs-extra', () => ({
      writeFile: jest.fn().mockResolvedValue(undefined),
      existsSync: jest.fn().mockReturnValue(true),
      mkdirSync: jest.fn(),
      unlinkSync: jest.fn()
    }));
    
    // Use a different port for testing to avoid conflicts with the running server
    process.env.PORT = 3004;
    
    // Dynamically import the server with mocks in place
    server = require('../../server');
  });

  afterAll(async () => {
    // Close server if it's running
    if (server && server.close) {
      await new Promise(resolve => server.close(resolve));
    }
  });

  describe('POST /api/chat', () => {
    test('should return a chat response for a valid request', async () => {
      const response = await request(server)
        .post('/api/chat')
        .send({
          message: 'Hello, AI companion!',
          systemPromptMode: 'friendly'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('response');
      expect(response.body).toHaveProperty('conversationId');
    });

    test('should return 400 for request without a message', async () => {
      const response = await request(server)
        .post('/api/chat')
        .send({
          systemPromptMode: 'friendly'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/tts', () => {
    test('should convert text to speech and return audio URL', async () => {
      const response = await request(server)
        .post('/api/tts')
        .send({
          text: 'Text to be converted to speech'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('audioUrl');
    });

    test('should return 400 for request without text', async () => {
      const response = await request(server)
        .post('/api/tts')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/admin/stats', () => {
    test('should return system statistics', async () => {
      const response = await request(server)
        .get('/api/admin/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('userCount');
      expect(response.body).toHaveProperty('conversationCount');
      expect(response.body).toHaveProperty('messageCount');
      expect(response.body).toHaveProperty('tokenUsage');
    });
  });
});
