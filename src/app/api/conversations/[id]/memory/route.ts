import { NextRequest, NextResponse } from 'next/server';
import { getConversationById } from '@/lib/services/prisma';
import { 
  getConversationSummaries, 
  createMemorySummary,
  getMessagesSinceLastSummary
} from '@/lib/services/memoryService';

// GET - Retrieve conversation memory
export async function GET(request: NextRequest) {
  try {
    // Parse the conversation ID from the URL
    const pathParts = request.nextUrl.pathname.split('/');
    const conversationId = pathParts[pathParts.indexOf('conversations') + 1];

    // Get summaries for the conversation
    const summaries = await getConversationSummaries(conversationId);

    return NextResponse.json({ summaries });
  } catch (error) {
    console.error('Error fetching memory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation memory' },
      { status: 500 }
    );
  }
}

// POST - Generate a new summary/memory
export async function POST(request: NextRequest) {
  try {
    const pathParts = request.nextUrl.pathname.split('/');
    const conversationId = pathParts[pathParts.indexOf('conversations') + 1];
    
    const body = await request.json();
    const { type = 'short_term' } = body;

    // Check if conversation exists
    const conversation = await getConversationById(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Get messages since last summary
    const messages = await getMessagesSinceLastSummary(conversationId);

    if (messages.length === 0) {
      return NextResponse.json(
        { error: 'No new messages to summarize' },
        { status: 400 }
      );
    }

    // Create a new memory summary
    const summary = await createMemorySummary(conversationId, messages, type);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error creating memory:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation memory' },
      { status: 500 }
    );
  }
} 