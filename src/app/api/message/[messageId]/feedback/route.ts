import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/services/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const { messageId } = params;
    const { feedback } = await request.json();
    
    // Validate input
    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }
    
    if (feedback !== 'like' && feedback !== 'dislike') {
      return NextResponse.json(
        { error: 'Feedback must be either "like" or "dislike"' },
        { status: 400 }
      );
    }
    
    const prisma = getPrismaClient();
    
    // Check if message exists
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }
    
    // Update or create feedback
    const feedbackRecord = await prisma.messageFeedback.upsert({
      where: {
        messageId,
      },
      update: {
        type: feedback,
      },
      create: {
        messageId,
        type: feedback,
      },
    });
    
    return NextResponse.json(
      { success: true, feedback: feedbackRecord },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing message feedback:', error);
    return NextResponse.json(
      { error: 'Failed to process feedback' },
      { status: 500 }
    );
  }
}