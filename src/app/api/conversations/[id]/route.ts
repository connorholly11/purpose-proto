import { NextRequest, NextResponse } from 'next/server';
import { getConversationById } from '@/lib/services/prisma';

export async function GET(request: NextRequest) {
  try {
    // Parse the conversation ID from the URL path segments
    const { pathname } = request.nextUrl;
    const segments = pathname.split('/');
    const id = segments[segments.length - 1];

    if (!id) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    const conversation = await getConversationById(id);

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

// If you want to PUT or DELETE, you can add them similarly, parsing `id` from request URL.
