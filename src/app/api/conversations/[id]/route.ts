import { NextRequest, NextResponse } from 'next/server';
import { getConversationById } from '@/lib/services/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
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

// If you want to PUT or DELETE here, you can define those methods. Example:

/*
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // update logic
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // delete logic
}
*/
