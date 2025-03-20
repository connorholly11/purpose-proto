import { getPrismaClient } from './prisma';

// Define the feedback type locally
interface GeneralFeedback {
  id: string;
  userId?: string | null;
  category: string;
  content: string;
  screenshot?: string | null;
  createdAt: Date;
}

/**
 * Create a new feedback entry
 */
export async function createFeedback(
  category: string,
  content: string,
  userId?: string,
  screenshot?: string
): Promise<GeneralFeedback> {
  const prisma = getPrismaClient();
  
  return prisma.$transaction(async (tx) => {
    // @ts-ignore - Prisma client hasn't been regenerated yet
    return tx.generalFeedback.create({
      data: {
        category,
        content,
        userId,
        screenshot
      }
    });
  });
}

/**
 * Get all feedback entries
 */
export async function getAllFeedback(): Promise<GeneralFeedback[]> {
  const prisma = getPrismaClient();
  
  return prisma.$transaction(async (tx) => {
    // @ts-ignore - Prisma client hasn't been regenerated yet
    return tx.generalFeedback.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: true
      }
    });
  });
}

/**
 * Get feedback by category
 */
export async function getFeedbackByCategory(category: string): Promise<GeneralFeedback[]> {
  const prisma = getPrismaClient();
  
  return prisma.$transaction(async (tx) => {
    // @ts-ignore - Prisma client hasn't been regenerated yet
    return tx.generalFeedback.findMany({
      where: {
        category
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: true
      }
    });
  });
}

/**
 * Get feedback by user
 */
export async function getFeedbackByUser(userId: string): Promise<GeneralFeedback[]> {
  const prisma = getPrismaClient();
  
  return prisma.$transaction(async (tx) => {
    // @ts-ignore - Prisma client hasn't been regenerated yet
    return tx.generalFeedback.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  });
}

/**
 * Delete feedback by ID
 */
export async function deleteFeedback(id: string): Promise<void> {
  const prisma = getPrismaClient();
  
  return prisma.$transaction(async (tx) => {
    // @ts-ignore - Prisma client hasn't been regenerated yet
    await tx.generalFeedback.delete({
      where: {
        id
      }
    });
  });
}

/**
 * Create message feedback
 */
export async function createMessageFeedback(messageId: string, type: string) {
  const prisma = getPrismaClient();
  
  // Validate feedback type
  if (type !== 'LIKE' && type !== 'DISLIKE') {
    throw new Error('Invalid feedback type');
  }
  
  return prisma.messageFeedback.create({
    data: {
      messageId,
      type,
    }
  });
}

/**
 * Get message feedback by message ID
 */
export async function getMessageFeedback(messageId: string) {
  const prisma = getPrismaClient();
  
  return prisma.messageFeedback.findUnique({
    where: {
      messageId
    }
  });
}

/**
 * Update message feedback
 */
export async function updateMessageFeedback(messageId: string, type: string) {
  const prisma = getPrismaClient();
  
  // Validate feedback type
  if (type !== 'LIKE' && type !== 'DISLIKE') {
    throw new Error('Invalid feedback type');
  }
  
  // Check if feedback exists
  const existingFeedback = await getMessageFeedback(messageId);
  
  if (existingFeedback) {
    // Update existing feedback
    return prisma.messageFeedback.update({
      where: {
        messageId
      },
      data: {
        type,
        updatedAt: new Date()
      }
    });
  } else {
    // Create new feedback
    return createMessageFeedback(messageId, type);
  }
} 