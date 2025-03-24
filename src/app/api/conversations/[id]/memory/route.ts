import { NextRequest, NextResponse } from 'next/server';
import { getConversationById } from '@/lib/services/prisma';
import { 
  getConversationSummaries, 
  createMemorySummary,
  getMessagesSinceLastSummary
} from '@/lib/services/memoryService';
import logger from '@/lib/utils/logger';

// GET - Retrieve conversation memory
export async function GET(request: NextRequest) {
  try {
    // Parse the conversation ID from the URL
    const pathParts = request.nextUrl.pathname.split('/');
    const conversationId = pathParts[pathParts.indexOf('conversations') + 1];
    
    logger.info('Memory API', 'Fetching memory summaries', { conversationId });

    // Get summaries for the conversation
    const summaries = await getConversationSummaries(conversationId);

    return NextResponse.json({ summaries });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error('Memory API', 'Error fetching memory', { error: errorMsg });
    
    // Return empty summaries instead of failing with 500
    return NextResponse.json({ summaries: [] });
  }
}

// POST - Generate a new summary/memory
export async function POST(request: NextRequest) {
  try {
    const pathParts = request.nextUrl.pathname.split('/');
    const conversationId = pathParts[pathParts.indexOf('conversations') + 1];
    
    const body = await request.json();
    const { type = 'short_term' } = body;
    
    logger.info('Memory API', 'Creating new memory summary', { 
      conversationId, 
      type 
    });

    // Check if conversation exists
    const conversation = await getConversationById(conversationId);
    if (!conversation) {
      logger.warn('Memory API', 'Conversation not found', { conversationId });
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Get messages since last summary
    const messages = await getMessagesSinceLastSummary(conversationId);

    if (messages.length === 0) {
      logger.info('Memory API', 'No new messages to summarize', { conversationId });
      return NextResponse.json(
        { error: 'No new messages to summarize' },
        { status: 400 }
      );
    }

    // Create a new memory summary
    const summary = await createMemorySummary(conversationId, messages, type);
    
    logger.info('Memory API', 'Memory summary created successfully', { 
      conversationId, 
      summaryId: summary?.id 
    });

    return NextResponse.json({ summary });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error('Memory API', 'Error creating memory', { error: errorMsg });
    
    return NextResponse.json(
      { error: 'Failed to create conversation memory' },
      { status: 500 }
    );
  }
} 