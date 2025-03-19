import { NextRequest, NextResponse } from 'next/server';
import { createConversation } from '@/lib/services/prisma';

export async function POST(req: NextRequest) {
  try {
    // Get user ID if provided (for authenticated users)
    const userId = req.headers.get('x-user-id') || undefined;
    
    // Create a new conversation
    const conversation = await createConversation(userId);
    
    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
} 