import { generateEmbedding, getCompletion, transcribeAudio, generateSpeech } from '@/lib/services/openai';
import OpenAI from 'openai';

// Mock OpenAI client
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => {
    return {
      embeddings: {
        create: jest.fn().mockResolvedValue({
          data: [{ embedding: [0.1, 0.2, 0.3, 0.4, 0.5] }],
        }),
      },
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'This is a test response' } }],
            usage: {
              prompt_tokens: 100,
              completion_tokens: 50,
              total_tokens: 150,
            },
          }),
        },
      },
      audio: {
        transcriptions: {
          create: jest.fn().mockResolvedValue({
            text: 'This is a test transcription',
          }),
        },
        speech: {
          create: jest.fn().mockResolvedValue({
            arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(10)),
          }),
        },
      },
    };
  });
});

// Set environment variables for testing
process.env.OPENAI_API_KEY = 'test-api-key';

describe('OpenAI Service Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateEmbedding function', () => {
    it('should call OpenAI API and return embedding', async () => {
      const text = 'This is a test text for embedding';
      const result = await generateEmbedding(text);
      
      // Verify the result is the mock embedding
      expect(result).toEqual([0.1, 0.2, 0.3, 0.4, 0.5]);
      
      // Verify OpenAI was called with the right parameters
      const openaiInstance = (OpenAI as unknown as jest.Mock).mock.results[0].value;
      expect(openaiInstance.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-3-small', // Default model
        input: text,
      });
    });
  });

  describe('getCompletion function', () => {
    it('should call OpenAI API and return completion without context', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const result = await getCompletion(messages);
      
      // Verify the result is the mock response
      expect(result).toBe('This is a test response');
      
      // Verify OpenAI was called with the right parameters
      const openaiInstance = (OpenAI as unknown as jest.Mock).mock.results[0].value;
      expect(openaiInstance.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4o',
        messages,
      });
    });

    it('should add context to system message when provided', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const context = 'This is additional context';
      const result = await getCompletion(messages, context);
      
      // Verify OpenAI was called with system message containing context
      const openaiInstance = (OpenAI as unknown as jest.Mock).mock.results[0].value;
      const expectedMessages = [
        {
          role: 'system',
          content: expect.stringContaining(context),
        },
        ...messages,
      ];
      
      expect(openaiInstance.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4o',
        messages: expectedMessages,
      });
    });

    it('should append context to existing system message if present', async () => {
      const existingSystemMessage = { role: 'system', content: 'Existing system prompt' };
      const messages = [existingSystemMessage, { role: 'user', content: 'Hello' }];
      const context = 'This is additional context';
      
      await getCompletion(messages, context);
      
      // Verify OpenAI was called with updated system message
      const openaiInstance = (OpenAI as unknown as jest.Mock).mock.results[0].value;
      const expectedSystemMessage = {
        role: 'system',
        content: expect.stringContaining(existingSystemMessage.content),
      };
      
      expect(openaiInstance.chat.completions.create.mock.calls[0][0].messages[0]).toMatchObject(expectedSystemMessage);
      expect(openaiInstance.chat.completions.create.mock.calls[0][0].messages[0].content).toEqual(
        expect.stringContaining(context)
      );
    });
  });

  describe('transcribeAudio function', () => {
    it('should transcribe audio data', async () => {
      // Mock fs functions
      jest.mock('fs', () => ({
        writeFileSync: jest.fn(),
        unlinkSync: jest.fn(),
      }));
      
      // Mock createReadStream
      jest.mock('fs', () => ({
        ...jest.requireActual('fs'),
        createReadStream: jest.fn().mockReturnValue('mock-stream'),
      }));
      
      const audioBuffer = Buffer.from('test audio data');
      const result = await transcribeAudio(audioBuffer);
      
      // Verify the result is the mock transcription
      expect(result).toBe('This is a test transcription');
      
      // Verify OpenAI was called correctly
      const openaiInstance = (OpenAI as unknown as jest.Mock).mock.results[0].value;
      expect(openaiInstance.audio.transcriptions.create).toHaveBeenCalled();
    });
  });

  describe('generateSpeech function', () => {
    it('should generate speech from text', async () => {
      const text = 'This is a test text for speech';
      const result = await generateSpeech(text);
      
      // Verify the result is a Buffer
      expect(Buffer.isBuffer(result)).toBe(true);
      
      // Verify OpenAI was called with the right parameters
      const openaiInstance = (OpenAI as unknown as jest.Mock).mock.results[0].value;
      expect(openaiInstance.audio.speech.create).toHaveBeenCalledWith({
        model: 'tts-1',
        voice: 'alloy',
        input: text,
      });
    });

    it('should use the specified voice', async () => {
      const text = 'This is a test text for speech';
      const voice = 'nova';
      await generateSpeech(text, voice);
      
      // Verify OpenAI was called with the specified voice
      const openaiInstance = (OpenAI as unknown as jest.Mock).mock.results[0].value;
      expect(openaiInstance.audio.speech.create).toHaveBeenCalledWith({
        model: 'tts-1',
        voice,
        input: text,
      });
    });
  });
}); 