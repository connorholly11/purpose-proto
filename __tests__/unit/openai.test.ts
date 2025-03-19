import { getOpenAIClient, generateEmbedding, getCompletion } from '@/lib/services/openai';
import OpenAI from 'openai';

// Mock the OpenAI module
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      embeddings: {
        create: jest.fn().mockResolvedValue({
          data: [{ embedding: [0.1, 0.2, 0.3] }]
        })
      },
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Mock response from GPT-4o' } }]
          })
        }
      },
      audio: {
        transcriptions: {
          create: jest.fn().mockResolvedValue({
            text: 'Mock transcription'
          })
        },
        speech: {
          create: jest.fn().mockResolvedValue({
            arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('Mock audio data'))
          })
        }
      }
    }))
  };
});

// Mock the fs and os modules
jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
  createReadStream: jest.fn()
}));

jest.mock('os', () => ({
  tmpdir: jest.fn().mockReturnValue('/tmp')
}));

jest.mock('path', () => ({
  join: jest.fn().mockReturnValue('/tmp/audio.webm')
}));

describe('OpenAI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the singleton instance before each test
    (getOpenAIClient as any).__instance = null;
    process.env.OPENAI_API_KEY = 'test-api-key';
    process.env.EMBEDDING_MODEL = 'text-embedding-3-small';
  });

  describe('getOpenAIClient', () => {
    it('should create a new OpenAI client with the API key', () => {
      const client = getOpenAIClient();
      expect(OpenAI).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
      expect(client).toBeDefined();
    });

    it('should throw an error if API key is not defined', () => {
      delete process.env.OPENAI_API_KEY;
      expect(() => getOpenAIClient()).toThrow('OPENAI_API_KEY is not defined in environment variables');
    });
  });

  describe('generateEmbedding', () => {
    it('should call OpenAI embeddings API with the correct parameters', async () => {
      const mockClient = getOpenAIClient();
      const embedding = await generateEmbedding('test text');
      
      expect(mockClient.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: 'test text'
      });
      
      expect(embedding).toEqual([0.1, 0.2, 0.3]);
    });
  });

  describe('getCompletion', () => {
    it('should call OpenAI chat completions API with the correct parameters', async () => {
      const mockClient = getOpenAIClient();
      const messages = [{ role: 'user', content: 'Hello' }];
      
      const response = await getCompletion(messages);
      
      expect(mockClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4o',
        messages
      });
      
      expect(response).toBe('Mock response from GPT-4o');
    });

    it('should add context to system message if provided', async () => {
      const mockClient = getOpenAIClient();
      const messages = [{ role: 'user', content: 'Hello' }];
      const context = 'This is some context';
      
      await getCompletion(messages, context);
      
      expect(mockClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: expect.stringContaining(context)
          },
          ...messages
        ]
      });
    });

    it('should append context to existing system message if one exists', async () => {
      const mockClient = getOpenAIClient();
      const messages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello' }
      ];
      const context = 'This is some context';
      
      await getCompletion(messages, context);
      
      const createCalls = (mockClient.chat.completions.create as jest.Mock).mock.calls;
      
      expect(mockClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('You are a helpful assistant.'),
          },
          { role: 'user', content: 'Hello' }
        ]
      });
      
      expect(createCalls[0][0].messages[0].content).toContain(context);
    });
  });
}); 