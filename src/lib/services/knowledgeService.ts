import { getPrismaClient } from './prisma';

// Define the type locally instead of importing from @prisma/client
interface UserKnowledgeItem {
  id: string;
  userId: string;
  title?: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Creates a new knowledge item for a user
 */
export async function createUserKnowledgeItem(userId: string, content: string, title?: string): Promise<UserKnowledgeItem> {
  const prisma = getPrismaClient();
  
  return prisma.$transaction(async (tx) => {
    // @ts-ignore - Prisma client hasn't been regenerated yet
    return tx.userKnowledgeItem.create({
      data: {
        userId,
        content,
        title
      }
    });
  });
}

/**
 * Gets all knowledge items for a user
 */
export async function getUserKnowledgeItems(userId: string): Promise<UserKnowledgeItem[]> {
  const prisma = getPrismaClient();
  
  return prisma.$transaction(async (tx) => {
    // @ts-ignore - Prisma client hasn't been regenerated yet
    return tx.userKnowledgeItem.findMany({
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
 * Gets a single knowledge item by ID
 */
export async function getKnowledgeItemById(id: string): Promise<UserKnowledgeItem | null> {
  const prisma = getPrismaClient();
  
  return prisma.$transaction(async (tx) => {
    // @ts-ignore - Prisma client hasn't been regenerated yet
    return tx.userKnowledgeItem.findUnique({
      where: {
        id
      }
    });
  });
}

/**
 * Updates a knowledge item
 */
export async function updateKnowledgeItem(
  id: string, 
  data: { content?: string; title?: string }
): Promise<UserKnowledgeItem> {
  const prisma = getPrismaClient();
  
  return prisma.$transaction(async (tx) => {
    // @ts-ignore - Prisma client hasn't been regenerated yet
    return tx.userKnowledgeItem.update({
      where: { id },
      data
    });
  });
}

/**
 * Deletes a knowledge item
 */
export async function deleteKnowledgeItem(id: string): Promise<void> {
  const prisma = getPrismaClient();
  
  await prisma.$transaction(async (tx) => {
    // @ts-ignore - Prisma client hasn't been regenerated yet
    await tx.userKnowledgeItem.delete({
      where: { id }
    });
  });
} 