import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/services/prisma';
import logger from '@/lib/utils/logger';

export async function GET(req: NextRequest) {
  const requestId = `api-rag-ops-${Date.now()}`;
  try {
    // Get conversationId from query params
    const url = new URL(req.url);
    const conversationId = url.searchParams.get('conversationId');
    
    if (!conversationId) {
      logger.warn('API', 'Missing conversationId in RAG operations request', { requestId });
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }
    
    logger.info('API', 'Fetching RAG operations', { 
      requestId, 
      conversationId 
    });
    
    const prisma = getPrismaClient();
    const ragOps = await (prisma as any).RAGOperation.findMany({
      where: {
        conversationId,
      },
      orderBy: {
        timestamp: 'desc',
      },
      include: {
        retrievedDocs: true,
      },
      take: 5,
    });
    
    logger.info('API', 'RAG operations fetched', { 
      requestId,
      operationCount: ragOps.length 
    });
    
    return NextResponse.json(ragOps);
  } catch (error) {
    logger.error('API', 'Error fetching RAG operations', { 
      requestId,
      error: (error as Error).message 
    });
    return NextResponse.json(
      { error: 'Failed to fetch RAG operations' },
      { status: 500 }
    );
  }
} 