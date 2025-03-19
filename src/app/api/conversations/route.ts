import { NextRequest, NextResponse } from 'next/server';
import { listConversations } from '@/lib/services/prisma';

export async function GET(req: NextRequest) {
  try {
    // Get user ID from query params if provided
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