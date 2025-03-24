/**
 * Test suite for API endpoints
 */
import { NextRequest, NextResponse } from 'next/server';
import { POST as transcribePostHandler } from '@/app/api/transcribe/route';
import { POST as completionPostHandler } from '@/app/api/completion/route';
import { POST as ragPostHandler } from '@/app/api/rag/route';
import { GET as conversationGetHandler } from '@/app/api/conversations/[id]/route';
import { POST as conversationPostHandler } from '@/app/api/conversations/route';

// Mock global fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock the services used by the API endpoints
jest.mock('@/lib/services/openai', () => ({
  getCompletion: jest.fn().mockResolvedValue('This is a test response'),
  transcribeAudio: jest.fn().mockResolvedValue('This is a test transcription'),
  generateSpeech: jest.fn().mockResolvedValue(Buffer.from('test audio data')),
  generateEmbedding: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
}));

jest.mock('@/lib/services/pinecone', () => ({
  queryDocumentsOld: jest.fn().mockResolvedValue({
    context: 'Test context',
    matches: [{ id: 'doc-1', score: 0.9, text: 'Test text', source: 'test' }],
    operationTime: 100,
    requestId: 'rag-123',
  }),
}));

jest.mock('@/lib/services/prisma', () => ({
  createConversation: jest.fn().mockResolvedValue({
    id: 'conv-123',
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    messages: [],
  }),
  getConversationById: jest.fn().mockResolvedValue({
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
        createdAt: new Date(),
      },
      {
        id: 'msg-2',
        conversationId: 'conv-123',
        role: 'assistant',
        content: 'Hi there',
        createdAt: new Date(),
      },
    ],
  }),
  createMessage: jest.fn().mockImplementation(({ conversationId, role, content }) => {
    return Promise.resolve({
      id: `msg-${Date.now()}`,
      conversationId,
      role,
      content,
      createdAt: new Date(),
    });
  }),
  getPrismaClient: jest.fn().mockReturnValue({
    RAGOperation: {
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
    },
  }),
}));

// Helper to create mock request objects
function createMockRequest(method: string, body?: any, headers: Record<string, string> = {}) {
  const request = {
    method,
    headers: new Headers(headers),
    json: jest.fn().mockResolvedValue(body),
  };
  return request as unknown as NextRequest;
}

// Helper to parse response JSON
async function parseResponseJson(response: NextResponse) {
  const text = await response.json();
  return text;
}

describe('API Endpoints Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RAG API Endpoint', () => {
    it('should process a RAG request and return results', async () => {
      // Create a mock request with query
      const mockRequest = createMockRequest('POST', { userQuery: 'test query' }, {
        'x-conversation-id': 'conv-123',
        'x-source': 'chat',
      });

      // Call the handler
      const response = await ragPostHandler(mockRequest);
      
      // Verify response status
      expect(response.status).toBe(200);
      
      // Parse the response JSON
      const data = await parseResponseJson(response);
      
      // Verify the response structure
      expect(data).toHaveProperty('answer');
      expect(data).toHaveProperty('ragInfo');
      expect(data.ragInfo).toHaveProperty('operationTime');
      expect(data.ragInfo).toHaveProperty('matchCount');
    });

    it('should return 400 for invalid requests', async () => {
      // Create a mock request without userQuery
      const mockRequest = createMockRequest('POST', {}, {});

      // Call the handler
      const response = await ragPostHandler(mockRequest);
      
      // Verify response status
      expect(response.status).toBe(400);
      
      // Parse the response JSON
      const data = await parseResponseJson(response);
      
      // Verify the error message
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('userQuery is required');
    });
  });

  describe('Transcribe API Endpoint', () => {
    it('should transcribe audio files', async () => {
      // Create a mock FormData with an audio file
      const mockFormData = {
        get: jest.fn().mockImplementation((key) => {
          if (key === 'file') {
            return new File(['audio content'], 'test-audio.webm', { type: 'audio/webm' });
          }
          return null;
        })
      };

      // Create a mock request
      const mockRequest = createMockRequest('POST');
      mockRequest.formData = jest.fn().mockResolvedValue(mockFormData);

      // Call the handler
      const response = await transcribePostHandler(mockRequest);
      
      // Verify response status
      expect(response.status).toBe(200);
      
      // Parse the response JSON
      const data = await parseResponseJson(response);
      
      // Verify the response structure
      expect(data).toHaveProperty('text');
    });
  });

  describe('Completion API Endpoint', () => {
    it('should generate a completion with context', async () => {
      // Create a mock request with messages and context
      const mockRequest = createMockRequest('POST', {
        messages: [{ role: 'user', content: 'Hello' }],
        context: 'This is some context',
        conversationId: 'conv-123',
      });

      // Call the handler
      const response = await completionPostHandler(mockRequest);
      
      // Verify response status
      expect(response.status).toBe(200);
      
      // Parse the response JSON
      const data = await parseResponseJson(response);
      
      // Verify the response structure
      expect(data).toHaveProperty('answer');
    });
  });

  describe('Conversation API Endpoints', () => {
    it('should create a new conversation', async () => {
      // Create mock request with user ID header
      const mockRequest = createMockRequest('POST', {}, {
        'x-user-id': 'user-123',
      });

      // Call the handler
      const response = await conversationPostHandler(mockRequest);
      
      // Verify response status
      expect(response.status).toBe(200);
      
      // Parse the response JSON
      const data = await parseResponseJson(response);
      
      // Verify the response structure
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('userId', 'user-123');
    });

    it('should retrieve a conversation by ID', async () => {
      // Create a mock params object with the ID
      const params = { id: 'conv-123' };
      
      // Create a mock request
      const mockRequest = createMockRequest('GET');

      // Call the handler
      const response = await conversationGetHandler(mockRequest, { params });
      
      // Verify response status
      expect(response.status).toBe(200);
      
      // Parse the response JSON
      const data = await parseResponseJson(response);
      
      // Verify the response structure
      expect(data).toHaveProperty('id', 'conv-123');
      expect(data).toHaveProperty('messages');
      expect(data.messages).toHaveLength(2);
    });
  });
}); 