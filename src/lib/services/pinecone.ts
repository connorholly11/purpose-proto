import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeDocument, RAGQueryResult, RAGMatch } from '@/types';
import { generateEmbedding } from './openai';
import { getPrismaClient } from './prisma';
import logger from '@/lib/utils/logger';

let pineconeInstance: Pinecone | null = null;

export function getPineconeClient(): Pinecone {
  if (!pineconeInstance) {
    const apiKey = process.env.PINECONE_API_KEY;
    const host = process.env.PINECONE_HOST;
    
    if (!apiKey || !host) {
      logger.error('Pinecone', 'Missing environment variables', { missingVars: ['PINECONE_API_KEY', 'PINECONE_HOST'].filter(v => !process.env[v]) });
      throw new Error('PINECONE_API_KEY or PINECONE_HOST is not defined in environment variables');
    }
    
    logger.info('Pinecone', 'Initializing Pinecone client');
    pineconeInstance = new Pinecone({
      apiKey,
    });
  }
  
  return pineconeInstance;
}

export async function upsertDocuments(documents: { text: string; source?: string }[]): Promise<void> {
  logger.info('Pinecone', 'Upserting documents', { count: documents.length });
  const pinecone = getPineconeClient();
  const indexName = process.env.PINECONE_INDEX;
  
  if (!indexName) {
    logger.error('Pinecone', 'Missing PINECONE_INDEX environment variable');
    throw new Error('PINECONE_INDEX is not defined in environment variables');
  }
  
  const index = pinecone.index(indexName);
  
  const vectors: PineconeDocument[] = [];
  
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    logger.debug('Pinecone', `Generating embedding for document ${i+1}/${documents.length}`, {
      textLength: doc.text.length,
      source: doc.source
    });
    
    const embedding = await generateEmbedding(doc.text);
    
    vectors.push({
      id: `doc-${Date.now()}-${i}`,
      values: embedding,
      metadata: {
        text: doc.text,
        source: doc.source,
      },
    });
  }
  
  logger.info('Pinecone', `Upserting ${vectors.length} vectors to Pinecone`);
  await index.upsert(vectors);
  logger.info('Pinecone', 'Document upsert complete');
}

export async function queryDocuments(query: string, topK: number = 5, source: string = "chat", conversationId?: string): Promise<RAGQueryResult> {
  const startTime = Date.now();
  const requestId = `rag-${Date.now()}`;
  
  logger.info('RAG', 'Starting RAG query', {
    requestId,
    query: query.length > 100 ? query.substring(0, 100) + '...' : query,
    topK,
    source,
    conversationId: conversationId || 'none'
  });
  
  const pinecone = getPineconeClient();
  const indexName = process.env.PINECONE_INDEX;
  
  if (!indexName) {
    logger.error('Pinecone', 'Missing PINECONE_INDEX environment variable', { requestId });
    throw new Error('PINECONE_INDEX is not defined in environment variables');
  }
  
  const index = pinecone.index(indexName);
  
  // Generate embedding for the query
  logger.debug('RAG', 'Generating embedding for query', { requestId });
  const queryEmbedding = await generateEmbedding(query);
  logger.debug('RAG', 'Embedding generated', { 
    requestId,
    embeddingSize: queryEmbedding.length
  });
  
  // Query Pinecone
  logger.debug('RAG', 'Querying Pinecone', { requestId, topK });
  const queryResponse = await index.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
  });
  
  // Calculate operation time in milliseconds
  const operationTime = Date.now() - startTime;
  
  // Get matches from the response
  const matches = queryResponse.matches || [];
  logger.info('RAG', 'Pinecone query complete', { 
    requestId,
    matchCount: matches.length, 
    operationTime
  });
  
  // Log the RAG operation to the database if we have a conversationId
  if (conversationId) {
    // Use a separate try/catch to avoid failing the main operation if logging fails
    try {
      logger.debug('RAG', 'Logging RAG operation to database', { requestId, conversationId });
      const prisma = getPrismaClient();
      
      // Use a transaction to perform both creations atomically
      await prisma.$transaction(async (tx) => {
        // Create embedding record
        const embeddingRecord = await (tx as any).embedding.create({
          data: {
            text: query,
            vectorId: `query-${Date.now()}`,
            source: 'user_query',
          }
        });
        
        // Create RAG operation record
        await (tx as any).RAGOperation.create({
          data: {
            query,
            conversationId,
            source,
            operationTime,
            embeddingId: embeddingRecord.id,
            retrievedDocs: {
              create: matches.map(match => ({
                documentId: match.id,
                similarityScore: match.score || 0,
                content: String(match.metadata?.text || ''),
                source: match.metadata?.source ? String(match.metadata.source) : undefined,
                metadata: match.metadata || {},
              }))
            }
          }
        });
      });
      
      logger.info('RAG', 'RAG operation logged to database', { 
        requestId,
        query: query.substring(0, 30) + '...',
        conversationId
      });
    } catch (error) {
      logger.error('RAG', 'Error logging RAG operation', { 
        requestId,
        conversationId,
        error: (error as Error).message 
      });
      // Continue even if logging fails - don't block the main operation
    }
  }
  
  // Combine the matching documents' text for the response
  const context = matches
    .filter(match => match.metadata?.text)
    .map(match => match.metadata?.text)
    .join('\n\n');
  
  logger.debug('RAG', 'Generated context', { 
    requestId,
    contextLength: context.length,
    contextStart: context.substring(0, 100) + '...' 
  });
  
  // Return both the context and additional information about the operation
  const result = {
    context,
    matches: matches.map(match => ({
      id: match.id,
      score: match.score || 0,
      text: String(match.metadata?.text || ''),
      source: match.metadata?.source ? String(match.metadata.source) : undefined,
    })) as RAGMatch[],
    operationTime,
    requestId
  };
  
  logger.info('RAG', 'RAG query complete', { 
    requestId,
    operationTime, 
    matchCount: matches.length
  });
  
  return result;
} 