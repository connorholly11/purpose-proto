import { getPrismaClient } from './prisma';

// Define interfaces locally instead of importing from @prisma/client
interface SystemPrompt {
  id: string;
  name: string;
  content: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PromptFeedback {
  id: string;
  systemPromptId: string;
  userId?: string | null;
  rating: number;
  comments?: string | null;
  createdAt: Date;
  user?: any;
}

/**
 * Creates a new system prompt
 */
export async function createSystemPrompt(
  name: string,
  content: string,
  status: string = 'test'
): Promise<SystemPrompt> {
  const prisma = getPrismaClient();
  
  return prisma.$transaction(async (tx) => {
    // @ts-ignore - Prisma client hasn't been regenerated yet
    return tx.systemPrompt.create({
      data: {
        name,
        content,
        status
      }
    });
  });
}

/**
 * Gets all system prompts
 */
export async function getAllSystemPrompts(): Promise<SystemPrompt[]> {
  const prisma = getPrismaClient();
  
  return prisma.$transaction(async (tx) => {
    // @ts-ignore - Prisma client hasn't been regenerated yet
    return tx.systemPrompt.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
  });
}

/**
 * Gets a system prompt by ID
 */
export async function getSystemPromptById(id: string): Promise<SystemPrompt | null> {
  const prisma = getPrismaClient();
  
  return prisma.$transaction(async (tx) => {
    // @ts-ignore - Prisma client hasn't been regenerated yet
    return tx.systemPrompt.findUnique({
      where: {
        id
      }
    });
  });
}

/**
 * Updates a system prompt
 */
export async function updateSystemPrompt(
  id: string,
  data: { name?: string; content?: string; status?: string }
): Promise<SystemPrompt> {
  const prisma = getPrismaClient();
  
  return prisma.$transaction(async (tx) => {
    // @ts-ignore - Prisma client hasn't been regenerated yet
    return tx.systemPrompt.update({
      where: { id },
      data
    });
  });
}

/**
 * Deletes a system prompt
 */
export async function deleteSystemPrompt(id: string): Promise<void> {
  const prisma = getPrismaClient();
  
  await prisma.$transaction(async (tx) => {
    // @ts-ignore - Prisma client hasn't been regenerated yet
    await tx.systemPrompt.delete({
      where: { id }
    });
  });
}

/**
 * Gets the active system prompt
 */
export async function getActiveSystemPrompt(): Promise<SystemPrompt | null> {
  const prisma = getPrismaClient();
  
  return prisma.$transaction(async (tx) => {
    // @ts-ignore - Prisma client hasn't been regenerated yet
    return tx.systemPrompt.findFirst({
      where: {
        status: 'active'
      }
    });
  });
}

/**
 * Sets a system prompt as active (and deactivates all others)
 */
export async function setActiveSystemPrompt(id: string): Promise<SystemPrompt> {
  const prisma = getPrismaClient();
  
  return prisma.$transaction(async (tx) => {
    // First, deactivate all prompts
    // @ts-ignore - Prisma client hasn't been regenerated yet
    await tx.systemPrompt.updateMany({
      where: {
        status: 'active'
      },
      data: {
        status: 'inactive'
      }
    });
    
    // Then, activate the specified prompt
    // @ts-ignore - Prisma client hasn't been regenerated yet
    return tx.systemPrompt.update({
      where: { id },
      data: {
        status: 'active'
      }
    });
  });
}

/**
 * Randomly selects a test prompt for A/B testing
 */
export async function getRandomTestPrompt(): Promise<SystemPrompt | null> {
  const prisma = getPrismaClient();
  
  return prisma.$transaction(async (tx) => {
    // @ts-ignore - Prisma client hasn't been regenerated yet
    const testPrompts = await tx.systemPrompt.findMany({
      where: {
        status: 'test'
      }
    });
    
    if (testPrompts.length === 0) {
      return getActiveSystemPrompt();
    }
    
    // Randomly select a prompt
    const randomIndex = Math.floor(Math.random() * testPrompts.length);
    return testPrompts[randomIndex];
  });
}

/**
 * Creates prompt feedback
 */
export async function createPromptFeedback(
  systemPromptId: string,
  rating: number,
  userId?: string,
  comments?: string
): Promise<PromptFeedback> {
  const prisma = getPrismaClient();
  
  return prisma.$transaction(async (tx) => {
    // @ts-ignore - Prisma client hasn't been regenerated yet
    return tx.promptFeedback.create({
      data: {
        systemPromptId,
        rating,
        userId,
        comments
      }
    });
  });
}

/**
 * Gets feedback for a system prompt
 */
export async function getPromptFeedback(systemPromptId: string): Promise<PromptFeedback[]> {
  const prisma = getPrismaClient();
  
  return prisma.$transaction(async (tx) => {
    // @ts-ignore - Prisma client hasn't been regenerated yet
    return tx.promptFeedback.findMany({
      where: {
        systemPromptId
      },
      include: {
        user: true
      }
    });
  });
}

/**
 * Gets prompt performance metrics
 */
export async function getPromptPerformanceMetrics(): Promise<Array<{
  id: string;
  name: string;
  status: string;
  conversationCount: number;
  feedbackCount: number;
  averageRating: number;
}>> {
  const prisma = getPrismaClient();
  
  return prisma.$transaction(async (tx) => {
    // @ts-ignore - Prisma client hasn't been regenerated yet
    const prompts = await tx.systemPrompt.findMany({
      include: {
        _count: {
          select: {
            conversations: true,
            feedback: true
          }
        }
      }
    });
    
    const promptsWithMetrics = await Promise.all(prompts.map(async (prompt: any) => {
      // Calculate average rating
      // @ts-ignore - Prisma client hasn't been regenerated yet
      const feedback = await tx.promptFeedback.findMany({
        where: {
          systemPromptId: prompt.id
        },
        select: {
          rating: true
        }
      });
      
      const totalRating = feedback.reduce((sum: number, item: any) => sum + item.rating, 0);
      const averageRating = feedback.length > 0 ? totalRating / feedback.length : 0;
      
      return {
        id: prompt.id,
        name: prompt.name,
        status: prompt.status,
        conversationCount: prompt._count.conversations,
        feedbackCount: prompt._count.feedback,
        averageRating
      };
    }));
    
    return promptsWithMetrics;
  });
} 