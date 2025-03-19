import { NextResponse } from 'next/server';
import { createConversation } from '@/lib/services/prisma';
import logger from '@/lib/utils/logger';

export async function POST() {
  const requestId = `api-create-conv-${Date.now()}`;
  try {
    logger.info('API', 'Creating conversation', { requestId });
    const conversation = await createConversation();
    logger.info('API', 'Conversation created', { 
      requestId, 
      conversationId: conversation.id 
    });
    return NextResponse.json(conversation);
  } catch (error) {
    logger.error('API', 'Error creating conversation', { 
      requestId,
      error: (error as Error).message 
    });
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
} 