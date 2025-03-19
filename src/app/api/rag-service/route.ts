import { NextRequest, NextResponse } from 'next/server';
import { queryDocuments } from '@/lib/services/pinecone';
import logger from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
  const requestId = `api-rag-${Date.now()}`;
  try {
    logger.info('API', 'RAG service request received', { requestId });
    
    // Parse request body
    const body = await req.json();
    const { query, topK = 5, source = 'chat', conversationId } = body;
    
    logger.debug('API', 'RAG service request details', { 
      requestId,
      query: query?.length > 50 ? query.substring(0, 50) + '...' : query,
      topK, 
      source,
      conversationId: conversationId || 'none'
    });
    
    if (!query || typeof query !== 'string') {
      logger.warn('API', 'Invalid RAG request - missing query', { requestId });
      return NextResponse.json(
        { error: 'Invalid request, query is required' },
        { status: 400 }
      );
    }
    
    // Call pinecone service
    logger.debug('API', 'Calling queryDocuments', { requestId });
    const startTime = Date.now();
    const result = await queryDocuments(query, topK, source, conversationId);
    const duration = Date.now() - startTime;
    
    logger.info('API', 'RAG service request completed', { 
      requestId, 
      duration,
      matchCount: result.matches.length 
    });
    
    return NextResponse.json(result);
  } catch (error) {
    logger.error('API', 'Error in RAG service', { 
      requestId,
      error: (error as Error).message
    });
    return NextResponse.json(
      { error: 'Error processing RAG request' },
      { status: 500 }
    );
  }
} 