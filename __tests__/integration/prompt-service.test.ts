import {
  createSystemPrompt,
  getAllSystemPrompts,
  getSystemPromptById,
  updateSystemPrompt,
  deleteSystemPrompt,
  getActiveSystemPrompt,
  setActiveSystemPrompt,
  getRandomTestPrompt,
  createPromptFeedback
} from '@/lib/services/promptService';

// Mock Prisma client
const mockSystemPromptCreate = jest.fn();
const mockSystemPromptFindMany = jest.fn();
const mockSystemPromptFindFirst = jest.fn();
const mockSystemPromptFindUnique = jest.fn();
const mockSystemPromptUpdate = jest.fn();
const mockSystemPromptUpdateMany = jest.fn();
const mockSystemPromptDelete = jest.fn();
const mockPromptFeedbackCreate = jest.fn();
const mockPromptFeedbackFindMany = jest.fn();

const mockTransaction = jest.fn(callback => {
  return callback({
    systemPrompt: {
      create: mockSystemPromptCreate,
      findMany: mockSystemPromptFindMany,
      findFirst: mockSystemPromptFindFirst,
      findUnique: mockSystemPromptFindUnique,
      update: mockSystemPromptUpdate,
      updateMany: mockSystemPromptUpdateMany,
      delete: mockSystemPromptDelete,
    },
    promptFeedback: {
      create: mockPromptFeedbackCreate,
      findMany: mockPromptFeedbackFindMany,
    }
  });
});

jest.mock('@/lib/services/prisma', () => ({
  getPrismaClient: jest.fn().mockReturnValue({
    $transaction: mockTransaction
  })
}));

describe('Prompt Service Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSystemPrompt function', () => {
    it('should create a new system prompt', async () => {
      // Setup mock return
      const mockPrompt = {
        id: 'prompt-123',
        name: 'Test Prompt',
        content: 'You are a helpful assistant',
        status: 'test',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockSystemPromptCreate.mockResolvedValue(mockPrompt);

      // Call the function
      const result = await createSystemPrompt('Test Prompt', 'You are a helpful assistant', 'test');

      // Verify the result
      expect(result).toEqual(mockPrompt);

      // Verify the Prisma call
      expect(mockSystemPromptCreate).toHaveBeenCalledWith({
        data: {
          name: 'Test Prompt',
          content: 'You are a helpful assistant',
          status: 'test'
        }
      });
    });
  });

  describe('getAllSystemPrompts function', () => {
    it('should get all system prompts', async () => {
      // Setup mock return
      const mockPrompts = [
        {
          id: 'prompt-123',
          name: 'Test Prompt 1',
          content: 'You are a helpful assistant',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'prompt-456',
          name: 'Test Prompt 2',
          content: 'You are a coding assistant',
          status: 'test',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      mockSystemPromptFindMany.mockResolvedValue(mockPrompts);

      // Call the function
      const result = await getAllSystemPrompts();

      // Verify the result
      expect(result).toEqual(mockPrompts);

      // Verify the Prisma call
      expect(mockSystemPromptFindMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('getSystemPromptById function', () => {
    it('should get a system prompt by ID', async () => {
      // Setup mock return
      const mockPrompt = {
        id: 'prompt-123',
        name: 'Test Prompt',
        content: 'You are a helpful assistant',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockSystemPromptFindUnique.mockResolvedValue(mockPrompt);

      // Call the function
      const result = await getSystemPromptById('prompt-123');

      // Verify the result
      expect(result).toEqual(mockPrompt);

      // Verify the Prisma call
      expect(mockSystemPromptFindUnique).toHaveBeenCalledWith({
        where: { id: 'prompt-123' }
      });
    });
  });

  describe('updateSystemPrompt function', () => {
    it('should update a system prompt', async () => {
      // Setup mock return
      const mockUpdatedPrompt = {
        id: 'prompt-123',
        name: 'Updated Prompt',
        content: 'You are an updated assistant',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockSystemPromptUpdate.mockResolvedValue(mockUpdatedPrompt);

      // Call the function
      const result = await updateSystemPrompt('prompt-123', {
        name: 'Updated Prompt',
        content: 'You are an updated assistant'
      });

      // Verify the result
      expect(result).toEqual(mockUpdatedPrompt);

      // Verify the Prisma call
      expect(mockSystemPromptUpdate).toHaveBeenCalledWith({
        where: { id: 'prompt-123' },
        data: {
          name: 'Updated Prompt',
          content: 'You are an updated assistant'
        }
      });
    });
  });

  describe('deleteSystemPrompt function', () => {
    it('should delete a system prompt', async () => {
      mockSystemPromptDelete.mockResolvedValue({});

      // Call the function
      await deleteSystemPrompt('prompt-123');

      // Verify the Prisma call
      expect(mockSystemPromptDelete).toHaveBeenCalledWith({
        where: { id: 'prompt-123' }
      });
    });
  });

  describe('getActiveSystemPrompt function', () => {
    it('should get the active system prompt', async () => {
      // Setup mock return
      const mockActivePrompt = {
        id: 'prompt-123',
        name: 'Active Prompt',
        content: 'You are a helpful assistant',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockSystemPromptFindFirst.mockResolvedValue(mockActivePrompt);

      // Call the function
      const result = await getActiveSystemPrompt();

      // Verify the result
      expect(result).toEqual(mockActivePrompt);

      // Verify the Prisma call
      expect(mockSystemPromptFindFirst).toHaveBeenCalledWith({
        where: { status: 'active' }
      });
    });

    it('should return null when no active prompt exists', async () => {
      mockSystemPromptFindFirst.mockResolvedValue(null);

      const result = await getActiveSystemPrompt();
      expect(result).toBeNull();
    });
  });

  describe('setActiveSystemPrompt function', () => {
    it('should set a system prompt as active and deactivate others', async () => {
      // Setup mock returns
      mockSystemPromptUpdateMany.mockResolvedValue({ count: 1 });
      const mockUpdatedPrompt = {
        id: 'prompt-123',
        name: 'New Active Prompt',
        content: 'You are a helpful assistant',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockSystemPromptUpdate.mockResolvedValue(mockUpdatedPrompt);

      // Call the function
      const result = await setActiveSystemPrompt('prompt-123');

      // Verify the result
      expect(result).toEqual(mockUpdatedPrompt);

      // Verify the Prisma calls
      expect(mockSystemPromptUpdateMany).toHaveBeenCalledWith({
        where: { status: 'active' },
        data: { status: 'inactive' }
      });

      expect(mockSystemPromptUpdate).toHaveBeenCalledWith({
        where: { id: 'prompt-123' },
        data: { status: 'active' }
      });
    });
  });

  describe('getRandomTestPrompt function', () => {
    it('should return a random test prompt if available', async () => {
      // Setup mock returns
      const mockTestPrompts = [
        {
          id: 'prompt-123',
          name: 'Test Prompt 1',
          content: 'You are a helpful assistant',
          status: 'test',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'prompt-456',
          name: 'Test Prompt 2',
          content: 'You are a coding assistant',
          status: 'test',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      mockSystemPromptFindMany.mockResolvedValue(mockTestPrompts);

      // Call the function
      const result = await getRandomTestPrompt();

      // Verify the result is one of the test prompts
      expect(mockTestPrompts).toContainEqual(result);

      // Verify the Prisma call
      expect(mockSystemPromptFindMany).toHaveBeenCalledWith({
        where: { status: 'test' }
      });
    });

    it('should fall back to active prompt if no test prompts available', async () => {
      // Setup mock returns for an empty test prompts array
      mockSystemPromptFindMany.mockResolvedValue([]);
      
      // Setup mock return for active prompt
      const mockActivePrompt = {
        id: 'prompt-789',
        name: 'Active Prompt',
        content: 'You are the main assistant',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockSystemPromptFindFirst.mockResolvedValue(mockActivePrompt);

      // Call the function
      const result = await getRandomTestPrompt();

      // Verify the result is the active prompt
      expect(result).toEqual(mockActivePrompt);
    });
  });

  describe('createPromptFeedback function', () => {
    it('should create feedback for a system prompt', async () => {
      // Setup mock return
      const mockFeedback = {
        id: 'feedback-123',
        systemPromptId: 'prompt-123',
        userId: 'user-123',
        rating: 5,
        comments: 'Great prompt!',
        createdAt: new Date()
      };
      mockPromptFeedbackCreate.mockResolvedValue(mockFeedback);

      // Call the function
      const result = await createPromptFeedback('prompt-123', 5, 'user-123', 'Great prompt!');

      // Verify the result
      expect(result).toEqual(mockFeedback);

      // Verify the Prisma call
      expect(mockPromptFeedbackCreate).toHaveBeenCalledWith({
        data: {
          systemPromptId: 'prompt-123',
          rating: 5,
          userId: 'user-123',
          comments: 'Great prompt!'
        }
      });
    });
  });
}); 