import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeDocument, RAGQueryResult, RAGMatch } from '@/types';
import { generateEmbedding } from './openai';
import { getPrismaClient } from './prisma';

let pineconeInstance: Pinecone | null = null;

export function getPineconeClient(): Pinecone {
  if (!pineconeInstance) {
    const apiKey = process.env.PINECONE_API_KEY;
    const host = process.env.PINECONE_HOST;
    
    if (!apiKey || !host) {
      throw new Error('PINECONE_API_KEY or PINECONE_HOST is not defined in environment variables');
    }
    
    pineconeInstance = new Pinecone({
      apiKey,
    });
  }
  
  return pineconeInstance;
}

export async function upsertDocuments(documents: { text: string; source?: string }[]): Promise<void> {
  const pinecone = getPineconeClient();
  const indexName = process.env.PINECONE_INDEX;
  
  if (!indexName) {
    throw new Error('PINECONE_INDEX is not defined in environment variables');
  }
  
  const index = pinecone.index(indexName);
  
  const vectors: PineconeDocument[] = [];
  
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
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
  
  await index.upsert(vectors);
}

export async function queryDocuments(query: string, topK: number = 5, source: string = "chat", conversationId?: string): Promise<RAGQueryResult> {
  const startTime = Date.now();
  const pinecone = getPineconeClient();
  const indexName = process.env.PINECONE_INDEX;
  
  if (!indexName) {
    throw new Error('PINECONE_INDEX is not defined in environment variables');
  }
  
  const index = pinecone.index(indexName);
  
  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);
  
  // Query Pinecone
  const queryResponse = await index.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
  });
  
  // Calculate operation time in milliseconds
  const operationTime = Date.now() - startTime;
  
  // Get matches from the response
  const matches = queryResponse.matches || [];
  
  // Log the RAG operation to the database if we have a conversationId
  if (conversationId) {
    // Use a separate try/catch to avoid failing the main operation if logging fails
    try {
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
      
      console.log(`Logged RAG operation for query: ${query.substring(0, 30)}...`);
    } catch (error) {
      console.error('Error logging RAG operation:', error);
      // Continue even if logging fails - don't block the main operation
    }
  }
  
  // Combine the matching documents' text for the response
  const context = matches
    .filter(match => match.metadata?.text)
    .map(match => match.metadata?.text)
    .join('\n\n');
  
  // Return both the context and additional information about the operation
  return {
    context,
    matches: matches.map(match => ({
      id: match.id,
      score: match.score || 0,
      text: String(match.metadata?.text || ''),
      source: match.metadata?.source ? String(match.metadata.source) : undefined,
    })) as RAGMatch[],
    operationTime,
  };
} 