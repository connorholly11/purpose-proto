import { NextRequest, NextResponse } from 'next/server';
import { queryDocuments } from '@/lib/services/pinecone';
import { getCompletion } from '@/lib/services/openai';
import { createMessage, getPrismaClient } from '@/lib/services/prisma';
import { RAGRequest, RAGResponse } from '@/types';

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json() as RAGRequest;
    const { userQuery } = body;
    
    if (!userQuery || typeof userQuery !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request, userQuery is required' },
        { status: 400 }
      );
    }
    
    // Get conversation ID if provided, will be used for logging
    const conversationId = req.headers.get('x-conversation-id');
    // Get source type (chat or realtime_voice)
    const source = req.headers.get('x-source') || 'chat';
    
    // Retrieve context from Pinecone
    const ragResult = await queryDocuments(userQuery, 5, source as string, conversationId || undefined);
    
    // Prepare message history - just the current query in this case
    const messages = [
      {
        role: 'user',
        content: userQuery,
      },
    ];
    
    // Get completion from OpenAI with context from RAG
    const answer = await getCompletion(messages, ragResult.context);
    
    // Log the interaction if conversationId is provided
    if (conversationId) {
      const prisma = getPrismaClient();
      
      // Log user query
      const userMessage = await createMessage({
        conversationId,
        role: 'user',
        content: userQuery,
      });
      
      // Log assistant response
      const assistantMessage = await createMessage({
        conversationId,
        role: 'assistant',
        content: answer,
      });
      
      // If we have existing RAG operations, link them to the messages
      try {
        // Find operations for this conversation from recent timeframe
        const recentRagOps = await (prisma as any).RAGOperation.findMany({
          where: {
            conversationId,
            query: userQuery,
            timestamp: {
              gte: new Date(Date.now() - 5000), // Operations from last 5 seconds
            },
          },
          orderBy: {
            timestamp: 'desc',
          },
          take: 1,
        });
        
        // Link the operation to the message if found
        if (recentRagOps.length > 0) {
          await (prisma as any).RAGOperation.update({
            where: {
              id: recentRagOps[0].id,
            },
            data: {
              messageId: userMessage.id,
            },
          });
        }
      } catch (err) {
        console.error('Error linking RAG operation to message:', err);
        // Non-critical error, we can continue
      }
    }
    
    // Return the response
    const response: RAGResponse = { 
      answer,
      ragInfo: {
        operationTime: ragResult.operationTime,
        matchCount: ragResult.matches.length,
      }
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing RAG request:', error);
    return NextResponse.json(
      { error: 'Error processing request' },
      { status: 500 }
    );
  }
} 