import { PrismaClient } from '@prisma/client';
import { Message } from '@/types';

// Create a singleton instance of PrismaClient
let prismaInstance: PrismaClient | null = null;

// Use a global variable to ensure single instance across hot reloads in development
declare global {
  var _prismaClient: PrismaClient | undefined;
}

export function getPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV === 'production') {
    // In production, use regular singleton pattern
    if (!prismaInstance) {
      prismaInstance = new PrismaClient();
    }
    return prismaInstance;
  } else {
    // In development, use global to preserve instance across hot reloads
    if (!global._prismaClient) {
      global._prismaClient = new PrismaClient();
    }
    return global._prismaClient;
  }
}

// User operations
export async function createUser(name?: string) {
  const prisma = getPrismaClient();
  return prisma.user.create({
    data: {
      name,
    },
  });
}

export async function getUserById(id: string) {
  const prisma = getPrismaClient();
  return prisma.user.findUnique({
    where: { id },
    include: {
      conversations: {
        include: {
          messages: true,
        },
      },
    },
  });
}

// Conversation operations
export async function createConversation(userId?: string) {
  const prisma = getPrismaClient();
  return prisma.conversation.create({
    data: {
      userId,
    },
  });
}

export async function getConversationById(id: string) {
  const prisma = getPrismaClient();
  return prisma.conversation.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });
}

export async function listConversations(userId?: string, limit: number = 10) {
  const prisma = getPrismaClient();
  return prisma.conversation.findMany({
    where: userId ? { userId } : undefined,
    include: {
      _count: {
        select: { messages: true },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: limit,
  });
}

// Message operations
export async function createMessage(data: {
  conversationId: string;
  role: string;
  content: string;
}) {
  const prisma = getPrismaClient();
  return prisma.message.create({
    data,
  });
}

export async function getConversationMessages(conversationId: string) {
  const prisma = getPrismaClient();
  return prisma.message.findMany({
    where: {
      conversationId,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}

// Add user message and AI response in a single transaction
export async function addExchange(
  conversationId: string,
  userContent: string,
  aiContent: string
) {
  const prisma = getPrismaClient();
  
  return prisma.$transaction(async (tx) => {
    // Add the user message
    await tx.message.create({
      data: {
        conversationId,
        role: 'user',
        content: userContent,
      },
    });
    
    // Add the AI response
    await tx.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: aiContent,
      },
    });
    
    // Update conversation's updatedAt timestamp
    await tx.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
  });
} 