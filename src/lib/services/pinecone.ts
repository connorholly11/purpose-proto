import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeDocument, RAGQueryResult, RAGMatch } from '@/types';
import { generateEmbedding } from './openai';
import { getPrismaClient } from './prisma';
import logger from '@/lib/utils/logger';
import { getUserKnowledgeItems } from './knowledgeService';

let pineconeInstance: Pinecone | null = null;

export function getPineconeClient(): Pinecone {
  if (!pineconeInstance) {
    const apiKey = process.env.PINECONE_API_KEY;
    const host = process.env.PINECONE_HOST;

    if (!apiKey || !host) {
      logger.error('Pinecone', 'Missing environment variables', {
        missingVars: ['PINECONE_API_KEY', 'PINECONE_HOST'].filter(v => !process.env[v]),
      });
      throw new Error('PINECONE_API_KEY or PINECONE_HOST is not defined in environment variables');
    }

    logger.info('Pinecone', 'Initializing Pinecone client');
    pineconeInstance = new Pinecone({ apiKey });
  }
  return pineconeInstance;
}

/**
 * Upsert documents to Pinecone.
 */
export async function upsertDocuments(
  documents: { text: string; source?: string; userId?: string }[]
): Promise<void> {
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
    logger.debug('Pinecone', `Generating embedding for document ${i + 1}/${documents.length}`, {
      textLength: doc.text.length,
      source: doc.source,
      userId: doc.userId,
    });
    const embedding = await generateEmbedding(doc.text);
    const docId = `doc-${Date.now()}-${i}`;

    vectors.push({
      id: docId,
      values: embedding,
      metadata: {
        text: doc.text,
        source: doc.source,
        userId: doc.userId,
      } as any,
    });
  }

  logger.info('Pinecone', `Upserting ${vectors.length} vectors to Pinecone`);
  await index.upsert(vectors);
  logger.info('Pinecone', 'Document upsert complete');
}

/**
 * Query Pinecone for relevant documents. Supports optional user knowledge from DB.
 */
export async function queryDocuments(
  query: string,
  topK: number = 5,
  userId?: string,
  additionalContext?: string
): Promise<any[]> {
  try {
    // Parse topK safely
    const finalTopK = !topK || isNaN(topK) ? 5 : topK;

    // Check if this is an identity-related query
    const isIdentityQuery = query.toLowerCase().includes("who am i") || 
                           query.toLowerCase().includes("about me") || 
                           query.toLowerCase().includes("know about me") || 
                           query.toLowerCase().includes("tell me about myself") ||
                           query.toLowerCase().includes("what do you know");

    const combinedQuery = query + (additionalContext ? ` ${additionalContext}` : '');
    const queryEmbedding = await generateEmbedding(combinedQuery);

    const pinecone = getPineconeClient();
    const indexName = process.env.PINECONE_INDEX;
    if (!indexName) {
      throw new Error('PINECONE_INDEX is not defined in environment variables');
    }
    const index = pinecone.index(indexName);

    // Prepare filter for user-specific data if userId provided
    const filter = userId ? {
      $or: [
        { userId: { $eq: userId } },
        { userId: { $exists: false } }
      ]
    } : undefined;

    // Query Pinecone
    logger.debug('Pinecone', 'Querying Pinecone', {
      topK: finalTopK,
      userId: userId || 'none',
      hasAdditionalContext: !!additionalContext,
      hasFilter: !!filter,
      queryLength: query.length,
      isIdentityQuery
    });

    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK: finalTopK,
      includeMetadata: true,
      filter,
    });

    const matches = (queryResponse.matches || []).map((match: any) => ({
      id: match.id,
      score: match.score,
      metadata: match.metadata,
      content: match.metadata?.text || ''
    }));

    logger.info('Pinecone', 'Pinecone search results', {
      matchesFound: matches.length,
      userId: userId || 'none',
      topScore: matches.length > 0 ? matches[0].score : 0
    });

    // If userId is provided, fetch user-specific knowledge from DB
    let knowledgeMatches: any[] = [];
    if (userId) {
      logger.debug('Pinecone', 'Fetching user knowledge items', { userId });
      const userKnowledgeItems = await getUserKnowledgeItems(userId);
      
      if (userKnowledgeItems.length > 0) {
        logger.info('Pinecone', 'Processing user knowledge items', { 
          count: userKnowledgeItems.length,
          userId,
          isIdentityQuery
        });
        
        // For identity queries, include ALL knowledge items with boosted scores
        if (isIdentityQuery) {
          logger.info('Pinecone', 'Identity query detected - including ALL knowledge items');
          
          knowledgeMatches = userKnowledgeItems.map(item => ({
            id: item.id,
            // Give a very high score to ensure these are prioritized
            score: 0.95,
            metadata: { 
              source: 'user_knowledge', 
              title: item.title || 'Personal Information',
              userId: item.userId 
            },
            content: item.content,
          }));
        } else {
          // Regular semantic similarity for non-identity queries
          for (const item of userKnowledgeItems) {
            const itemEmbedding = await generateEmbedding(item.content);
            const similarity = cosineSimilarity(queryEmbedding, itemEmbedding);
            
            logger.debug('Pinecone', 'Knowledge item similarity', {
              itemId: item.id,
              similarity,
              title: item.title || 'Untitled',
              contentPreview: item.content.substring(0, 50) + (item.content.length > 50 ? '...' : '')
            });
            
            // Lower threshold to ensure knowledge items are included (0.6 -> 0.45)
            // For general queries, be more liberal with inclusion of personal facts
            if (similarity > 0.45 || 
                query.toLowerCase().includes("tell me about") || 
                query.toLowerCase().includes("who am i")) {
              logger.info('Pinecone', 'Including knowledge item in results', {
                itemId: item.id,
                similarity,
                title: item.title || 'Untitled'
              });
              
              // Boost similarity scores for personal knowledge to ensure they get used
              const boostedScore = Math.min(similarity * 1.5, 1.0);
              
              knowledgeMatches.push({
                id: item.id,
                score: boostedScore,
                metadata: { 
                  source: 'user_knowledge', 
                  title: item.title || 'Untitled',
                  userId: item.userId 
                },
                content: item.content,
              });
            }
          }
        }
        
        // Also upsert knowledge items to Pinecone for future queries
        // We do this async so it doesn't slow down the current query
        try {
          logger.debug('Pinecone', 'Upserting knowledge items to Pinecone', { count: userKnowledgeItems.length });
          upsertDocuments(userKnowledgeItems.map(item => ({
            text: item.content,
            source: 'user_knowledge',
            userId: item.userId
          }))).catch(err => {
            logger.error('Pinecone', 'Error upserting knowledge items', { error: (err as Error).message });
          });
        } catch (error) {
          logger.error('Pinecone', 'Error preparing knowledge items for upsert', { 
            error: (error as Error).message 
          });
        }
      } else {
        logger.info('Pinecone', 'No user knowledge items found', { userId });
      }
    }
    
    // Combine and re-sort matches
    const allMatches = [...matches, ...knowledgeMatches];
    
    // For identity queries, prioritize user knowledge over other matches
    if (isIdentityQuery) {
      // Sort first by source (user_knowledge first), then by score
      allMatches.sort((a, b) => {
        const aIsUserKnowledge = a.metadata?.source === 'user_knowledge' ? 1 : 0;
        const bIsUserKnowledge = b.metadata?.source === 'user_knowledge' ? 1 : 0;
        
        if (aIsUserKnowledge !== bIsUserKnowledge) {
          return bIsUserKnowledge - aIsUserKnowledge;
        }
        
        return b.score - a.score;
      });
    } else {
      // Regular sorting by score
      allMatches.sort((a, b) => b.score - a.score);
    }
    
    logger.info('Pinecone', 'Query results combined', {
      pineconeMatches: matches.length,
      knowledgeMatches: knowledgeMatches.length,
      totalMatches: allMatches.length,
      topMatchType: allMatches.length > 0 ? allMatches[0].metadata?.source || 'unknown' : 'none',
      isIdentityQuery
    });
    
    // For testing or identity queries, return more matches than requested
    // This ensures we show more user knowledge items
    const finalLimit = (process.env.NODE_ENV === 'production' && !isIdentityQuery) 
      ? finalTopK 
      : Math.max(finalTopK, isIdentityQuery ? 20 : 8);
    
    return allMatches.slice(0, finalLimit);
  } catch (error) {
    logger.error('Pinecone', 'Error querying documents', {
      error: (error as Error).message,
      query: query.substring(0, 50) + (query.length > 50 ? '...' : ''),
      userId: userId || 'none'
    });
    throw error;
  }
}

/**
 * Legacy RAG query function. You can remove if no longer needed.
 */
export async function queryDocumentsOld(
  query: string,
  topK: number = 5,
  source: string = 'chat',
  conversationId?: string
): Promise<RAGQueryResult> {
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
    throw new Error('PINECONE_INDEX is not defined');
  }
  const index = pinecone.index(indexName);

  logger.debug('RAG', 'Generating embedding for query', { requestId });
  const queryEmbedding = await generateEmbedding(query);

  logger.debug('RAG', 'Querying Pinecone', { requestId, topK });
  const queryResponse = await index.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
  });

  const operationTime = Date.now() - startTime;
  const matches = queryResponse.matches || [];
  logger.info('RAG', 'Pinecone query complete', {
    requestId,
    matchCount: matches.length,
    operationTime
  });

  // DB logging example
  if (conversationId) {
    try {
      logger.debug('RAG', 'Logging RAG operation to database', { requestId, conversationId });
      const prisma = getPrismaClient();
      await prisma.$transaction(async (tx) => {
        const embeddingRecord = await (tx as any).embedding.create({
          data: {
            text: query,
            vectorId: `query-${Date.now()}`,
            source: 'user_query',
          }
        });
        await (tx as any).RAGOperation.create({
          data: {
            query,
            conversationId,
            source,
            operationTime,
            embeddingId: embeddingRecord.id,
            retrievedDocs: {
              create: matches.map((match: any) => ({
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
    } catch (err) {
      logger.error('RAG', 'Error logging RAG operation', { requestId, conversationId, error: (err as Error).message });
    }
  }

  const context = matches
    .filter((m: any) => m.metadata?.text)
    .map((m: any) => m.metadata?.text)
    .join('\n\n');

  logger.debug('RAG', 'Generated context', {
    requestId,
    contextLength: context.length,
    contextStart: context.substring(0, 100) + '...'
  });

  const result: RAGQueryResult = {
    context,
    matches: matches.map((m: any) => ({
      id: m.id,
      score: m.score || 0,
      text: String(m.metadata?.text || ''),
      source: m.metadata?.source ? String(m.metadata.source) : undefined,
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

/**
 * Simple cosine similarity helper
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must be of the same length');
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  if (normA === 0 || normB === 0) {
    return 0;
  }
  return dotProduct / (normA * normB);
}
