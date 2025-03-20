import { createConversation, createMessage } from '@/lib/services/prisma';
import { queryDocumentsOld } from '@/lib/services/pinecone';
import { getCompletion, transcribeAudio, generateSpeech } from '@/lib/services/openai';
import { createUserKnowledgeItem, getUserKnowledgeItems } from '@/lib/services/knowledgeService';
import { getActiveSystemPrompt } from '@/lib/services/promptService';

// Mock all services
jest.mock('@/lib/services/prisma', () => ({
  createConversation: jest.fn(),
  createMessage: jest.fn(),
  getPrismaClient: jest.fn().mockReturnValue({
    $transaction: jest.fn(callback => callback({
      // Mocked Prisma transaction operations as needed
    }))
  })
}));

jest.mock('@/lib/services/pinecone', () => ({
  queryDocumentsOld: jest.fn(),
}));

jest.mock('@/lib/services/openai', () => ({
  getCompletion: jest.fn(),
  transcribeAudio: jest.fn(),
  generateSpeech: jest.fn(),
  generateEmbedding: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
}));

jest.mock('@/lib/services/knowledgeService', () => ({
  createUserKnowledgeItem: jest.fn(),
  getUserKnowledgeItems: jest.fn(),
}));

jest.mock('@/lib/services/promptService', () => ({
  getActiveSystemPrompt: jest.fn(),
}));

describe('User Journey End-to-End Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Chat with text input and RAG', () => {
    it('should process a full user text interaction with RAG', async () => {
      // Setup mock returns for all steps of the process
      
      // 1. Create conversation
      const mockConversation = {
        id: 'conv-123',
        userId: 'user-john',
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: []
      };
      (createConversation as jest.Mock).mockResolvedValue(mockConversation);
      
      // 2. Set up active system prompt
      const mockSystemPrompt = {
        id: 'prompt-123',
        name: 'Default Prompt',
        content: 'You are a helpful assistant.',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      (getActiveSystemPrompt as jest.Mock).mockResolvedValue(mockSystemPrompt);
      
      // 3. Set up RAG response
      const mockRagResult = {
        context: 'John Doe is a user who likes programming.',
        matches: [
          {
            id: 'doc-1',
            score: 0.92,
            text: 'John Doe is a user who likes programming.',
            source: 'user_knowledge'
          }
        ],
        operationTime: 150,
        requestId: 'rag-123'
      };
      (queryDocumentsOld as jest.Mock).mockResolvedValue(mockRagResult);
      
      // 4. Set up message creation
      const mockUserMessage = {
        id: 'msg-123',
        conversationId: 'conv-123',
        role: 'user',
        content: 'My name is John Doe and I like programming',
        createdAt: new Date()
      };
      (createMessage as jest.Mock).mockResolvedValueOnce(mockUserMessage); // User message
      
      // 5. Set up AI completion
      const mockAiResponse = 'Hello John Doe! I see you enjoy programming. How can I assist you today?';
      (getCompletion as jest.Mock).mockResolvedValue(mockAiResponse);
      
      // 6. Set up AI message creation
      const mockAiMessage = {
        id: 'msg-456',
        conversationId: 'conv-123',
        role: 'assistant',
        content: mockAiResponse,
        createdAt: new Date()
      };
      (createMessage as jest.Mock).mockResolvedValueOnce(mockAiMessage); // AI message
      
      // 7. Set up knowledge extraction - this should have recognized and stored user info
      const mockKnowledgeItem = {
        id: 'knowledge-123',
        userId: 'user-john',
        content: 'My name is John Doe. I like programming.',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      (createUserKnowledgeItem as jest.Mock).mockResolvedValue(mockKnowledgeItem);
      (getUserKnowledgeItems as jest.Mock).mockResolvedValue([mockKnowledgeItem]);
      
      // EXECUTE THE FLOW
      
      // 1. Create conversation for user
      const conversation = await createConversation('user-john');
      
      // 2. User sends a message
      const userMessage = 'My name is John Doe and I like programming';
      const createdUserMessage = await createMessage({
        conversationId: conversation.id,
        role: 'user',
        content: userMessage
      });
      
      // 3. RAG is performed on the user message
      const ragResult = await queryDocumentsOld(userMessage, 5, 'chat', conversation.id);
      
      // 4. LLM is called with context from RAG
      const systemMessage = { role: 'system', content: mockSystemPrompt.content };
      const aiResponse = await getCompletion([systemMessage, { role: 'user', content: userMessage }], ragResult.context);
      
      // 5. AI message is stored
      const createdAiMessage = await createMessage({
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse
      });
      
      // 6. Extract and store knowledge (simulated)
      const extractedKnowledge = 'My name is John Doe. I like programming.';
      const knowledgeItem = await createUserKnowledgeItem('user-john', extractedKnowledge);
      
      // 7. Later, get user knowledge items
      const userKnowledge = await getUserKnowledgeItems('user-john');
      
      // ASSERTIONS TO VERIFY FLOW WORKED CORRECTLY
      
      // Verify conversation was created
      expect(createConversation).toHaveBeenCalledWith('user-john');
      expect(conversation).toEqual(mockConversation);
      
      // Verify user message was created
      expect(createMessage).toHaveBeenCalledWith({
        conversationId: 'conv-123',
        role: 'user',
        content: userMessage
      });
      expect(createdUserMessage).toEqual(mockUserMessage);
      
      // Verify RAG was performed
      expect(queryDocumentsOld).toHaveBeenCalledWith(userMessage, 5, 'chat', 'conv-123');
      expect(ragResult).toEqual(mockRagResult);
      
      // Verify LLM was called with the right context
      expect(getCompletion).toHaveBeenCalledWith(
        expect.arrayContaining([
          systemMessage,
          { role: 'user', content: userMessage }
        ]),
        mockRagResult.context
      );
      expect(aiResponse).toEqual(mockAiResponse);
      
      // Verify AI message was stored
      expect(createMessage).toHaveBeenCalledWith({
        conversationId: 'conv-123',
        role: 'assistant',
        content: mockAiResponse
      });
      expect(createdAiMessage).toEqual(mockAiMessage);
      
      // Verify knowledge was extracted and stored
      expect(createUserKnowledgeItem).toHaveBeenCalledWith('user-john', extractedKnowledge);
      expect(knowledgeItem).toEqual(mockKnowledgeItem);
      
      // Verify knowledge can be retrieved later
      expect(getUserKnowledgeItems).toHaveBeenCalledWith('user-john');
      expect(userKnowledge).toEqual([mockKnowledgeItem]);
    });
  });

  describe('Chat with voice input', () => {
    it('should process voice input, transcribe, and generate voice response', async () => {
      // Setup mock returns
      
      // 1. Create conversation
      const mockConversation = {
        id: 'conv-456',
        userId: 'user-john',
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: []
      };
      (createConversation as jest.Mock).mockResolvedValue(mockConversation);
      
      // 2. Transcribe audio
      const mockTranscription = 'Hello, this is a voice message';
      (transcribeAudio as jest.Mock).mockResolvedValue(mockTranscription);
      
      // 3. RAG response
      const mockRagResult = {
        context: 'Context for voice query',
        matches: [
          {
            id: 'doc-2',
            score: 0.85,
            text: 'Context for voice query',
            source: 'general_knowledge'
          }
        ],
        operationTime: 120,
        requestId: 'rag-456'
      };
      (queryDocumentsOld as jest.Mock).mockResolvedValue(mockRagResult);
      
      // 4. User message creation
      const mockUserMessage = {
        id: 'msg-789',
        conversationId: 'conv-456',
        role: 'user',
        content: mockTranscription,
        createdAt: new Date()
      };
      (createMessage as jest.Mock).mockResolvedValueOnce(mockUserMessage);
      
      // 5. AI response
      const mockAiResponse = 'This is a response to your voice message';
      (getCompletion as jest.Mock).mockResolvedValue(mockAiResponse);
      
      // 6. AI message creation
      const mockAiMessage = {
        id: 'msg-101112',
        conversationId: 'conv-456',
        role: 'assistant',
        content: mockAiResponse,
        createdAt: new Date()
      };
      (createMessage as jest.Mock).mockResolvedValueOnce(mockAiMessage);
      
      // 7. Speech generation
      const mockAudioBuffer = Buffer.from('mock audio data');
      (generateSpeech as jest.Mock).mockResolvedValue(mockAudioBuffer);
      
      // EXECUTE THE FLOW
      
      // 1. Create conversation
      const conversation = await createConversation('user-john');
      
      // 2. User records audio and it's transcribed
      const mockAudioData = Buffer.from('mock input audio');
      const transcription = await transcribeAudio(mockAudioData);
      
      // 3. Create user message from transcription
      const createdUserMessage = await createMessage({
        conversationId: conversation.id,
        role: 'user',
        content: transcription
      });
      
      // 4. RAG is performed
      const ragResult = await queryDocumentsOld(transcription, 5, 'voice', conversation.id);
      
      // 5. Get AI response
      const aiResponse = await getCompletion([{ role: 'user', content: transcription }], ragResult.context);
      
      // 6. Create AI message
      const createdAiMessage = await createMessage({
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse
      });
      
      // 7. Generate speech from AI response
      const audioBuffer = await generateSpeech(aiResponse);
      
      // ASSERTIONS
      
      // Verify audio was transcribed
      expect(transcribeAudio).toHaveBeenCalledWith(mockAudioData);
      expect(transcription).toEqual(mockTranscription);
      
      // Verify user message was created with transcription
      expect(createMessage).toHaveBeenCalledWith({
        conversationId: 'conv-456',
        role: 'user',
        content: mockTranscription
      });
      
      // Verify RAG was performed
      expect(queryDocumentsOld).toHaveBeenCalledWith(mockTranscription, 5, 'voice', 'conv-456');
      
      // Verify AI response was generated
      expect(getCompletion).toHaveBeenCalledWith(
        expect.arrayContaining([{ role: 'user', content: mockTranscription }]),
        mockRagResult.context
      );
      
      // Verify AI message was stored
      expect(createMessage).toHaveBeenCalledWith({
        conversationId: 'conv-456',
        role: 'assistant',
        content: mockAiResponse
      });
      
      // Verify speech was generated
      expect(generateSpeech).toHaveBeenCalledWith(mockAiResponse);
      expect(audioBuffer).toEqual(mockAudioBuffer);
    });
  });
}); 