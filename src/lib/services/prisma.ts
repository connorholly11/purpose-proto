import { PrismaClient } from '@prisma/client';
import logger from '@/lib/utils/logger';
import { upsertDocuments } from '@/lib/services/pinecone';

let prismaInstance: PrismaClient | null = null;

declare global {
  // eslint-disable-next-line no-var
  var _prismaClient: PrismaClient | undefined;
}

export function getPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV === 'production') {
    if (!prismaInstance) {
      logger.info('Prisma', 'Initializing production Prisma client');
      prismaInstance = new PrismaClient({
        log: ['error', 'warn'],
        errorFormat: 'pretty',
      });
      
      // Ensure the database connection works
      const client = prismaInstance; // Create a stable reference
      client.$connect()
        .then(() => {
          logger.info('Prisma', 'Connected to database successfully');
          
          // Ensure uuid-ossp extension exists (best effort)
          return client.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
            .catch(err => {
              // Log but don't throw to prevent app crash - DB fix endpoint can handle this properly
              logger.error('Prisma', 'Failed to create uuid-ossp extension', { error: err.message });
            });
        })
        .catch(err => {
          logger.error('Prisma', 'Failed to connect to database', { 
            error: err.message,
            hint: 'Check DATABASE_URL environment variable and database accessibility'
          });
        });
    }
    return prismaInstance;
  } else {
    if (!global._prismaClient) {
      logger.info('Prisma', 'Initializing development Prisma client');
      global._prismaClient = new PrismaClient({
        log: ['query', 'error', 'warn'],
        errorFormat: 'pretty',
      });
      
      // Ensure uuid-ossp extension in development too
      global._prismaClient.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
        .catch(err => {
          logger.warn('Prisma', 'Failed to create uuid-ossp extension in development', { error: err.message });
        });
    }
    return global._prismaClient;
  }
}

// --------------------------------
// USER
// --------------------------------
export async function createUser(name?: string) {
  const prisma = getPrismaClient();
  try {
    return await prisma.user.create({
      data: {
        name,
      },
    });
  } catch (error) {
    logger.error('Prisma', 'Failed to create user', { 
      error: error instanceof Error ? error.message : String(error),
      name 
    });
    throw error;
  }
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

// --------------------------------
// CONVERSATION
// --------------------------------
export async function createConversation(userId?: string, systemPromptId?: string) {
  const prisma = getPrismaClient();
  return prisma.conversation.create({
    data: {
      userId,
      systemPromptId,
    } as any,
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

// --------------------------------
// MESSAGE
// --------------------------------
export async function createMessage(data: {
  conversationId: string;
  role: string;
  content: string;
}) {
  const prisma = getPrismaClient();
  const message = await prisma.message.create({
    data,
  });

  // If it's a user message, embed it in Pinecone
  if (message.role === 'user' && message.content && message.content.length > 0) {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: message.conversationId },
      });
      if (conversation?.userId) {
        logger.info('Prisma', 'Embedding user message to Pinecone', {
          conversationId: conversation.id,
          userId: conversation.userId,
          messageId: message.id,
        });
        await upsertDocuments([{
          text: message.content,
          source: 'user_message',
          userId: conversation.userId,
        }]);
      }
    } catch (embedErr) {
      logger.error('Prisma', 'Error embedding message to Pinecone', {
        error: (embedErr as Error).message,
        messageId: message.id,
      });
    }
  }

  return message;
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
    // Create the user message
    const userMessage = await tx.message.create({
      data: {
        conversationId,
        role: 'user',
        content: userContent,
      },
    });

    // Create the AI response
    const assistantMessage = await tx.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: aiContent,
      },
    });

    // Update conversation updatedAt
    await tx.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Attempt to embed the user message
    try {
      if (userMessage.content && userMessage.content.length > 0) {
        const conversation = await tx.conversation.findUnique({
          where: { id: conversationId },
        });
        if (conversation?.userId) {
          await upsertDocuments([{
            text: userMessage.content,
            source: 'user_message',
            userId: conversation.userId,
          }]);
        }
      }
    } catch (embedErr) {
      logger.error('Prisma', 'Error embedding user message in addExchange', {
        error: (embedErr as Error).message,
      });
    }

    return { userMessage, assistantMessage };
  });
}
