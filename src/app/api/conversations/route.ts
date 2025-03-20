import { NextRequest, NextResponse } from 'next/server';
import { listConversations, createConversation } from '@/lib/services/prisma';

export async function GET(req: NextRequest) {
  try {
    // Optionally get userId from query param to filter
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    // Get conversation list
    const conversations = await listConversations(userId, limit);

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations', conversations: [] },
      { status: 500 }
    );
  }
}

// Newly added POST method
export async function POST(req: NextRequest) {
  try {
    // If you want to parse userId from the request body or headers, do so here:
    // const { userId } = await req.json();
    // or const userId = req.headers.get('x-user-id') || undefined;

    const conversation = await createConversation(/* userId */);
    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
