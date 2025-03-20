import { extractUserInformation } from '@/lib/services/extraction';
import { createUserKnowledgeItem, getUserKnowledgeItems } from '@/lib/services/knowledgeService';
import { getCompletion } from '@/lib/services/openai';

// Mock the dependencies
jest.mock('@/lib/services/openai', () => ({
  getCompletion: jest.fn(),
}));

jest.mock('@/lib/services/knowledgeService', () => ({
  createUserKnowledgeItem: jest.fn(),
  getUserKnowledgeItems: jest.fn(),
}));

describe('Information Extraction Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock returns
    (getCompletion as jest.Mock).mockResolvedValue(JSON.stringify({
      informationExtracted: true,
      facts: [
        { type: 'name', value: 'John Doe' },
        { type: 'age', value: '30' },
        { type: 'occupation', value: 'Software Engineer' },
        { type: 'hobby', value: 'programming' },
      ]
    }));
    
    (createUserKnowledgeItem as jest.Mock).mockImplementation((userId, content) => {
      return Promise.resolve({
        id: `knowledge-${Date.now()}`,
        userId,
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
    
    (getUserKnowledgeItems as jest.Mock).mockResolvedValue([
      {
        id: 'knowledge-1',
        userId: 'user-123',
        content: 'User name is John Smith',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]);
  });
  
  describe('extractUserInformation function', () => {
    it('should extract information from user messages', async () => {
      const messages = [
        { role: 'user', content: 'Hello, my name is John Doe and I am 30 years old' },
        { role: 'assistant', content: 'Nice to meet you, John!' },
        { role: 'user', content: 'I work as a Software Engineer and enjoy programming in my free time' },
      ];
      
      const userId = 'user-123';
      
      // Call the function
      const extractionResult = await extractUserInformation(messages, userId);
      
      // Verify that getCompletion was called with the right prompt
      expect(getCompletion).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('Extract user information')
          })
        ]),
      );
      
      // Verify that results were processed correctly
      expect(extractionResult).toHaveProperty('informationExtracted', true);
      expect(extractionResult.facts).toHaveLength(4);
      
      // Verify knowledge items were created for each fact
      expect(createUserKnowledgeItem).toHaveBeenCalledTimes(4);
      expect(createUserKnowledgeItem).toHaveBeenCalledWith(
        'user-123', 
        expect.stringContaining('name: John Doe')
      );
      expect(createUserKnowledgeItem).toHaveBeenCalledWith(
        'user-123', 
        expect.stringContaining('age: 30')
      );
    });
    
    it('should handle messages with no extractable information', async () => {
      // Set up mock to return no facts
      (getCompletion as jest.Mock).mockResolvedValue(JSON.stringify({
        informationExtracted: false,
        facts: []
      }));
      
      const messages = [
        { role: 'user', content: 'What is the capital of France?' },
        { role: 'assistant', content: 'The capital of France is Paris.' },
        { role: 'user', content: 'Thanks for the information!' },
      ];
      
      const userId = 'user-123';
      
      // Call the function
      const extractionResult = await extractUserInformation(messages, userId);
      
      // Verify that results show no information extracted
      expect(extractionResult).toHaveProperty('informationExtracted', false);
      expect(extractionResult.facts).toHaveLength(0);
      
      // Verify no knowledge items were created
      expect(createUserKnowledgeItem).not.toHaveBeenCalled();
    });
    
    it('should compare with existing knowledge and only add new information', async () => {
      // Get existing knowledge first
      await extractUserInformation([], 'user-123');
      
      // Verify existing knowledge was checked
      expect(getUserKnowledgeItems).toHaveBeenCalledWith('user-123');
      
      // Set up mock to return some facts that overlap with existing knowledge
      (getCompletion as jest.Mock).mockResolvedValue(JSON.stringify({
        informationExtracted: true,
        facts: [
          { type: 'name', value: 'John Smith' }, // Already exists in knowledge base
          { type: 'occupation', value: 'Developer' }, // New information
        ]
      }));
      
      const messages = [
        { role: 'user', content: 'I am John Smith and I work as a Developer' },
      ];
      
      const userId = 'user-123';
      
      // Reset the createUserKnowledgeItem mock to track calls
      (createUserKnowledgeItem as jest.Mock).mockClear();
      
      // Call the function
      await extractUserInformation(messages, userId);
      
      // Verify only one new fact was added (the occupation), not the name
      expect(createUserKnowledgeItem).toHaveBeenCalledTimes(1);
      expect(createUserKnowledgeItem).toHaveBeenCalledWith(
        'user-123', 
        expect.stringContaining('occupation: Developer')
      );
    });
    
    it('should handle errors gracefully', async () => {
      // Set up mock to throw an error
      (getCompletion as jest.Mock).mockRejectedValue(new Error('API error'));
      
      const messages = [
        { role: 'user', content: 'My name is John and I am 30 years old' },
      ];
      
      const userId = 'user-123';
      
      // Call the function and ensure it doesn't throw
      await expect(extractUserInformation(messages, userId)).resolves.toEqual({
        informationExtracted: false,
        facts: [],
        error: expect.any(String)
      });
      
      // Verify no knowledge items were created
      expect(createUserKnowledgeItem).not.toHaveBeenCalled();
    });
  });
}); 