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
    
    // Retrieve context from Pinecone
    const context = await queryDocuments(userQuery);
    
    // Prepare message history - just the current query in this case
    const messages = [
      {
        role: 'user',
        content: userQuery,
      },
    ];
    
    // Get completion from OpenAI with context from RAG
    const answer = await getCompletion(messages, context);
    
    // Log the interaction if conversationId is provided
    if (conversationId) {
      const prisma = getPrismaClient();
      
      // Log user query
      await createMessage({
        conversationId,
        role: 'user',
        content: userQuery,
      });
      
      // Log assistant response
      await createMessage({
        conversationId,
        role: 'assistant',
        content: answer,
      });
    }
    
    // Return the response
    const response: RAGResponse = { answer };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing RAG request:', error);
    return NextResponse.json(
      { error: 'Error processing request' },
      { status: 500 }
    );
  }
} 