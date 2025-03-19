import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeDocument } from '@/types';
import { generateEmbedding } from './openai';

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

export async function queryDocuments(query: string, topK: number = 5): Promise<string> {
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
  
  // Combine the matching documents' text
  const matches = queryResponse.matches || [];
  const context = matches
    .filter(match => match.metadata?.text)
    .map(match => match.metadata?.text)
    .join('\n\n');
  
  return context;
} 