import { PrismaClient, Message, Prisma } from '@prisma/client';
import { OpenAIEmbeddings } from '@langchain/openai';

const prisma = new PrismaClient();
const embeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });

export interface MemorySummary {
  id: string;
  content: string;
  type: string;
  createdAt: Date;
  priority: number;
}

// Convert embedding to Prisma-compatible JSON
function embeddingToJson(embedding: number[]): Prisma.JsonValue {
  return embedding as unknown as Prisma.JsonValue;
}

// Generate a summary of conversation messages
export async function generateSummary(messages: Message[], type = 'short_term'): Promise<string> {
  try {
    // Call OpenAI to summarize the conversation
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a conversation summarizer. Summarize the following conversation in a ${
              type === 'short_term' ? 'concise' : type === 'medium_term' ? 'detailed' : 'comprehensive'
            } way, capturing key points and important information.`
          },
          ...messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        ],
        temperature: 0.3,
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error;
  }
}

// Create a new memory summary
export async function createMemorySummary(
  conversationId: string,
  messages: Message[],
  type = 'short_term'
): Promise<any> {
  try {
    // Generate summary of messages
    const summaryContent = await generateSummary(messages, type);
    
    // Create vector embedding for the summary
    const embedding = await embeddings.embedQuery(summaryContent);
    
    // Create the summary manually with raw SQL query (workaround for schema issues)
    await prisma.$executeRaw`
      INSERT INTO "ConversationSummary" (
        "id", "conversationId", "content", "type", 
        "startMessageId", "endMessageId", "embeddings", 
        "createdAt", "priority", "lastAccessed"
      ) VALUES (
        ${Prisma.raw('uuid_generate_v4()')}, 
        ${conversationId}, 
        ${summaryContent}, 
        ${type}, 
        ${messages[0].id}, 
        ${messages[messages.length - 1].id}, 
        ${Prisma.raw(`'${JSON.stringify(embedding)}'::jsonb`)}, 
        ${Prisma.raw('now()')}, 
        ${type === 'long_term' ? 10 : type === 'medium_term' ? 5 : 1},
        ${Prisma.raw('now()')}
      )
    `;
    
    // Update the conversation's lastSummarizedAt with raw SQL
    await prisma.$executeRaw`
      UPDATE "Conversation"
      SET "lastSummarizedAt" = ${Prisma.raw('now()')}
      WHERE "id" = ${conversationId}
    `;

    // Fetch the created summary
    const summary = await prisma.$queryRaw<MemorySummary[]>`
      SELECT "id", "content", "type", "createdAt", "priority"
      FROM "ConversationSummary"
      WHERE "conversationId" = ${conversationId}
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;

    return summary[0];
  } catch (error) {
    console.error('Error creating memory summary:', error);
    throw error;
  }
}

// Get summaries for a conversation
export async function getConversationSummaries(conversationId: string): Promise<MemorySummary[]> {
  try {
    // Use raw query to work around schema issues
    const summaries = await prisma.$queryRaw<MemorySummary[]>`
      SELECT "id", "content", "type", "createdAt", "priority"
      FROM "ConversationSummary"
      WHERE "conversationId" = ${conversationId}
      ORDER BY "createdAt" DESC
    `;
    
    return summaries;
  } catch (error) {
    console.error('Error fetching memory summaries:', error);
    throw error;
  }
}

// Get the most recent messages since the last summary
export async function getMessagesSinceLastSummary(conversationId: string): Promise<Message[]> {
  try {
    // Find the last summary with raw query
    const lastSummary = await prisma.$queryRaw<{createdAt: Date}[]>`
      SELECT "createdAt"
      FROM "ConversationSummary"
      WHERE "conversationId" = ${conversationId}
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;

    // Get messages after the last summary
    if (lastSummary.length > 0) {
      const lastSummaryDate = lastSummary[0].createdAt;
      return await prisma.message.findMany({
        where: { 
          conversationId,
          createdAt: { gt: lastSummaryDate }
        },
        orderBy: { createdAt: 'asc' }
      });
    } else {
      // If no summary exists, get all messages
      return await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' }
      });
    }
  } catch (error) {
    console.error('Error fetching messages since last summary:', error);
    throw error;
  }
}

// Check if summarization is needed (based on time or message count)
export async function shouldSummarize(
  conversationId: string, 
  timeSinceLastSummary = 60 * 60 * 1000, // 1 hour in milliseconds (reduced from 2 hours)
  messageCountThreshold = 5 // 5 messages (reduced from 10)
): Promise<boolean> {
  try {
    // Get the conversation with raw query
    const conversation = await prisma.$queryRaw<{id: string, lastSummarizedAt: Date | null}[]>`
      SELECT "id", "lastSummarizedAt"
      FROM "Conversation"
      WHERE "id" = ${conversationId}
    `;
    
    if (conversation.length === 0) return false;
    
    // If never summarized, we should summarize
    if (!conversation[0].lastSummarizedAt) return true;
    
    // Check if we've exceeded the time threshold
    const now = new Date();
    const timeSinceLastSummaryMs = now.getTime() - conversation[0].lastSummarizedAt.getTime();
    if (timeSinceLastSummaryMs >= timeSinceLastSummary) return true;
    
    // Check message count since last summary
    const messages = await getMessagesSinceLastSummary(conversationId);
    return messages.length >= messageCountThreshold;
  } catch (error) {
    console.error('Error checking if should summarize:', error);
    return false;
  }
} 