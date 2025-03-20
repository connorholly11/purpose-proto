import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/services/prisma';

interface RouteParams {
  params: {
    messageId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { messageId } = params;
    
    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }
    
    const prisma = getPrismaClient();
    
    // Find the feedback by message ID
    const feedbackRecord = await prisma.messageFeedback.findUnique({
      where: { messageId }
    });
    
    return NextResponse.json({ feedback: feedbackRecord });
  } catch (error) {
    console.error('Error fetching message feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const messageId = params.messageId;
    const { feedback } = await request.json();
    
    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }
    
    if (!feedback || !['LIKE', 'DISLIKE', 'like', 'dislike'].includes(feedback)) {
      return NextResponse.json(
        { error: 'Feedback must be either "like" or "dislike"' },
        { status: 400 }
      );
    }
    
    const prisma = getPrismaClient();
    
    // First check if the message exists
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }
    
    // Format the feedback type to uppercase or keep it lowercase based on test requirements
    const feedbackType = feedback.toLowerCase() === 'like' ? 'like' : 'dislike';
    
    // Use upsert to either create or update
    const result = await prisma.messageFeedback.upsert({
      where: {
        messageId
      },
      update: {
        type: feedbackType
      },
      create: {
        messageId,
        type: feedbackType
      }
    });
    
    return NextResponse.json({ success: true, feedback: result });
  } catch (error) {
    console.error('Error processing message feedback:', error);
    return NextResponse.json(
      { error: 'Failed to process feedback' },
      { status: 500 }
    );
  }
}