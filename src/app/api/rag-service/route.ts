import { NextRequest, NextResponse } from 'next/server';
import { queryDocuments } from '@/lib/services/pinecone';
import logger from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
  const requestId = `api-rag-${Date.now()}`;
  try {
    logger.info('API', 'RAG service request received', { requestId });

    const body = await req.json();
    const { query, topK = 5, source = 'chat', conversationId } = body;
    // parse topK into a safe integer
    const parsedTopK = typeof topK === 'number' ? topK : 5;

    // get userId from header if needed
    const userId = req.headers.get('x-user-id') || undefined;

    logger.debug('API', 'RAG service request details', {
      requestId,
      query: query?.substring(0, 50) || '',
      topK: parsedTopK,
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

    // Query documents
    const startTime = Date.now();
    const result = await queryDocuments(query, parsedTopK, userId, '');
    const duration = Date.now() - startTime;

    // Format the result
    const formattedResult = {
      context: result.map(item => item.content).join('\n\n'),
      matches: result.map(item => ({
        id: item.id,
        score: item.score,
        text: item.content,
        source: item.metadata?.source
      })),
      operationTime: duration
    };

    logger.info('API', 'RAG service request completed', {
      requestId,
      duration,
      matchCount: result.length
    });

    return NextResponse.json(formattedResult);
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
