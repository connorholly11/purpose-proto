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
    const { messageId } = params;
    const { feedback } = await request.json();
    
    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }
    
    if (feedback !== 'like' && feedback !== 'dislike') {
      return NextResponse.json(
        { error: 'Feedback must be "like" or "dislike"' },
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
    
    // Check if feedback already exists for this message
    const existingFeedback = await prisma.messageFeedback.findUnique({
      where: { messageId }
    });
    
    let result;
    
    if (existingFeedback) {
      // Update existing feedback
      result = await prisma.messageFeedback.update({
        where: { messageId },
        data: {
          type: feedback === 'like' ? 'LIKE' : 'DISLIKE',
          updatedAt: new Date()
        }
      });
    } else {
      // Create new feedback
      result = await prisma.messageFeedback.create({
        data: {
          messageId,
          type: feedback === 'like' ? 'LIKE' : 'DISLIKE'
        }
      });
    }
    
    return NextResponse.json({ success: true, feedback: result });
  } catch (error) {
    console.error('Error processing message feedback:', error);
    return NextResponse.json(
      { error: 'Failed to process feedback' },
      { status: 500 }
    );
  }
}