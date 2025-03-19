import { NextRequest, NextResponse } from 'next/server';
import { getCompletion } from '@/lib/services/openai';
import { createMessage } from '@/lib/services/prisma';
import logger from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
  const requestId = `api-completion-${Date.now()}`;
  try {
    logger.info('API', 'Completion request received', { requestId });
    
    // Parse request body
    const body = await req.json();
    const { messages, context, conversationId } = body;
    
    logger.debug('API', 'Completion request details', { 
      requestId,
      messageCount: messages?.length || 0,
      hasContext: !!context,
      contextLength: context?.length || 0,
      conversationId: conversationId || 'none'
    });
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      logger.warn('API', 'Invalid completion request - missing messages', { requestId });
      return NextResponse.json(
        { error: 'Invalid request, messages are required' },
        { status: 400 }
      );
    }
    
    // Get completion with context
    logger.debug('API', 'Calling getCompletion', { requestId });
    const startTime = Date.now();
    const answer = await getCompletion(messages, context);
    const duration = Date.now() - startTime;
    
    // Log to database if conversationId is provided
    if (conversationId) {
      try {
        logger.debug('API', 'Logging messages to database', { 
          requestId,
          conversationId,
          userMessageLength: messages[0].content.length,
          assistantMessageLength: answer.length
        });
        
        // Log user message
        await createMessage({
          conversationId,
          role: 'user',
          content: messages[0].content,
        });
        
        // Log assistant response
        await createMessage({
          conversationId,
          role: 'assistant',
          content: answer,
        });
        
        logger.info('API', 'Messages logged to database', { 
          requestId,
          conversationId 
        });
      } catch (err) {
        logger.error('API', 'Error logging messages to database', { 
          requestId,
          conversationId,
          error: (err as Error).message
        });
        // Continue even if logging fails
      }
    }
    
    logger.info('API', 'Completion request completed', { 
      requestId,
      duration,
      answerLength: answer.length
    });
    
    return NextResponse.json({ answer });
  } catch (error) {
    logger.error('API', 'Error in completion API', { 
      requestId,
      error: (error as Error).message
    });
    return NextResponse.json(
      { error: 'Error generating completion' },
      { status: 500 }
    );
  }
} 