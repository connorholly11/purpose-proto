import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from './prisma';

// Define the SystemPrompt type
type SystemPrompt = {
  id: string;
  name: string;
  promptText: string;
  isActive: boolean;
  isFavorite: boolean;
  modelName: string;
  createdAt: Date;
  updatedAt: Date;
};

// Define the UserActivePrompt type
type UserActivePrompt = {
  id: string;
  userId: string;
  promptId: string;
  createdAt: Date;
  updatedAt: Date;
  prompt: SystemPrompt;
};

/**
 * Get all system prompts
 * @returns Array of all system prompts, ordered by favorites first, then by name
 */
export async function getAllSystemPrompts(): Promise<SystemPrompt[]> {
  try {
    const prompts = await prisma.systemPrompt.findMany({
      orderBy: [
        { isFavorite: 'desc' },
        { name: 'asc' }
      ],
    });
    
    return prompts;
  } catch (error) {
    console.error('Error getting all system prompts:', error);
    throw new Error('Failed to retrieve system prompts');
  }
}

/**
 * Get the currently active system prompt (global default)
 * @returns The active system prompt or null if none is active
 */
export async function getActiveSystemPrompt(): Promise<SystemPrompt | null> {
  try {
    const activePrompt = await prisma.systemPrompt.findFirst({
      where: { isActive: true },
    });
    
    return activePrompt;
  } catch (error) {
    console.error('Error getting active system prompt:', error);
    throw new Error('Failed to retrieve active system prompt');
  }
}

/**
 * Get the active system prompt for a specific user
 * @param userId The user's Clerk ID
 * @returns The user's active system prompt or the global default if none set
 */
export async function getUserActiveSystemPrompt(userId: string): Promise<SystemPrompt | null> {
  try {
    // First try to get the user-specific active prompt
    const userActivePrompt = await prisma.userActivePrompt.findUnique({
      where: { userId },
      include: { prompt: true },
    });
    
    if (userActivePrompt) {
      return userActivePrompt.prompt;
    }
    
    // If no user-specific prompt is set, fall back to the global default
    return getActiveSystemPrompt();
  } catch (error) {
    console.error(`Error getting active system prompt for user ${userId}:`, error);
    throw new Error(`Failed to retrieve active system prompt for user ${userId}`);
  }
}

/**
 * Get a system prompt by ID
 * @param id The ID of the system prompt to retrieve
 * @returns The system prompt or null if not found
 */
export async function getSystemPromptById(id: string): Promise<SystemPrompt | null> {
  try {
    const prompt = await prisma.systemPrompt.findUnique({
      where: { id },
    });
    
    return prompt;
  } catch (error) {
    console.error(`Error getting system prompt with ID ${id}:`, error);
    throw new Error(`Failed to retrieve system prompt with ID ${id}`);
  }
}

/**
 * Create a new system prompt
 * @param name The name of the new prompt (must be unique)
 * @param promptText The text content of the prompt
 * @param modelName The model to use (defaults to "gpt-4o")
 * @param isFavorite Whether this prompt is a favorite (defaults to false)
 * @returns The newly created system prompt
 */
export async function createSystemPrompt(
  name: string,
  promptText: string,
  modelName: string = 'gpt-4o',
  isFavorite: boolean = false,
): Promise<SystemPrompt> {
  try {
    const newPrompt = await prisma.systemPrompt.create({
      data: {
        name,
        promptText,
        isActive: false, // New prompts are inactive by default
        modelName,       // Store the model name
        isFavorite,      // Store favorite status
      },
    });
    
    return newPrompt;
  } catch (error) {
    console.error('Error creating system prompt:', error);
    // Check for unique constraint violation
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint failed on the fields: (`name`)')
    ) {
      throw new Error(`A system prompt with the name "${name}" already exists`);
    }
    
    throw new Error('Failed to create system prompt');
  }
}

/**
 * Update an existing system prompt
 * @param id The ID of the prompt to update
 * @param data The fields to update
 * @returns The updated system prompt
 */
export async function updateSystemPrompt(
  id: string,
  data: { name?: string; promptText?: string; modelName?: string; isFavorite?: boolean },
): Promise<SystemPrompt> {
  try {
    const prompt = await prisma.systemPrompt.findUnique({ where: { id } });
    
    if (!prompt) {
      throw new Error(`System prompt with ID ${id} not found`);
    }
    
    const updatedPrompt = await prisma.systemPrompt.update({
      where: { id },
      data,
    });
    
    return updatedPrompt;
  } catch (error) {
    console.error(`Error updating system prompt ${id}:`, error);
    
    // Check for unique constraint violation
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint failed on the fields: (`name`)')
    ) {
      throw new Error(`A system prompt with the provided name already exists`);
    }
    
    // Re-throw the original error
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error(`Failed to update system prompt ${id}`);
  }
}

/**
 * Set a system prompt as the global default (for backward compatibility)
 * @param id The ID of the prompt to set as active
 * @returns The newly activated system prompt
 */
export async function setActiveSystemPrompt(id: string): Promise<SystemPrompt> {
  try {
    return await prisma.$transaction(async (tx: any) => {
      // First, deactivate all prompts
      await tx.systemPrompt.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
      
      // Then, activate the specified prompt
      const activatedPrompt = await tx.systemPrompt.update({
        where: { id },
        data: { isActive: true },
      });
      
      if (!activatedPrompt) {
        throw new Error(`System prompt with ID ${id} not found during activation.`);
      }

      return activatedPrompt;
    });
  } catch (error) {
    console.error(`Error setting system prompt ${id} as active:`, error);
    
    if (
      error instanceof Error &&
      error.message.includes('Record to update not found')
    ) {
      throw new Error(`System prompt with ID ${id} not found`);
    }
    
    throw new Error(`Failed to set system prompt ${id} as active`);
  }
}

/**
 * Set the active system prompt for a specific user
 * @param userId The user's Clerk ID
 * @param promptId The ID of the prompt to set as active for this user
 * @returns The UserActivePrompt record
 */
export async function setUserActiveSystemPrompt(
  userId: string,
  promptId: string,
): Promise<UserActivePrompt> {
  try {
    // Verify the prompt exists
    const prompt = await prisma.systemPrompt.findUnique({
      where: { id: promptId },
    });
    
    if (!prompt) {
      throw new Error(`System prompt with ID ${promptId} not found`);
    }

    // Upsert the UserActivePrompt record for this user
    const userActivePrompt = await prisma.userActivePrompt.upsert({
      where: { userId },
      update: {
        promptId,
        updatedAt: new Date(),
      },
      create: {
        userId,
        promptId,
      },
      include: {
        prompt: true,
      },
    });
    
    return userActivePrompt;
  } catch (error) {
    console.error(`Error setting active prompt for user ${userId}:`, error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error(`Failed to set active prompt for user ${userId}`);
  }
}

/**
 * Get the active system prompt for a user, or create one if none exists
 * @param userId The user's Clerk ID
 * @returns The active system prompt for the user
 */
export async function getOrCreateUserActivePrompt(userId: string): Promise<SystemPrompt> {
  try {
    // Try to get the user's active prompt
    const userActivePrompt = await getUserActiveSystemPrompt(userId);
    
    // If found, return it
    if (userActivePrompt) {
      return userActivePrompt;
    }
    
    // Otherwise, get the global default prompt
    const globalDefault = await getActiveSystemPrompt();
    
    // If there's a global default, set it as the user's active prompt
    if (globalDefault) {
      const newUserActivePrompt = await setUserActiveSystemPrompt(userId, globalDefault.id);
      return newUserActivePrompt.prompt;
    }
    
    // If there's no global default either, throw an error
    throw new Error('No active system prompt found');
  } catch (error) {
    console.error(`Error getting or creating active prompt for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Delete a system prompt by ID
 * @param id The ID of the system prompt to delete
 * @returns True if successfully deleted
 * @throws Error if the prompt doesn't exist or cannot be deleted
 */
export async function deleteSystemPrompt(id: string): Promise<boolean> {
  try {
    // First check if the prompt exists
    const prompt = await prisma.systemPrompt.findUnique({
      where: { id },
    });
    
    if (!prompt) {
      throw new Error(`System prompt with ID ${id} not found`);
    }
    
    // Check if this is the global active prompt
    if (prompt.isActive) {
      throw new Error('Cannot delete the global active system prompt. Please activate another prompt first.');
    }
    
    // Check if any users are using this prompt as their active prompt
    const usersUsingPrompt = await prisma.userActivePrompt.findFirst({
      where: { promptId: id },
    });
    
    if (usersUsingPrompt) {
      throw new Error('Cannot delete this prompt as it is currently in use by at least one user.');
    }
    
    // Delete the prompt
    await prisma.systemPrompt.delete({
      where: { id },
    });
    
    return true;
  } catch (error) {
    console.error(`Error deleting system prompt with ID ${id}:`, error);
    
    // Re-throw specific errors
    if (error instanceof Error) {
      if (error.message.includes('not found') || 
          error.message.includes('Cannot delete the active') ||
          error.message.includes('currently in use')) {
        throw error;
      }
    }
    
    throw new Error(`Failed to delete system prompt with ID ${id}`);
  }
}