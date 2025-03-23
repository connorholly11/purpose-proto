import { NextRequest, NextResponse } from 'next/server';
import { createUserKnowledgeItem, getUserKnowledgeItems } from '@/lib/services/knowledgeService';
import { upsertDocuments } from '@/lib/services/pinecone';
import logger from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    const knowledgeItems = await getUserKnowledgeItems(userId);
    return NextResponse.json({ knowledgeItems });
  } catch (error) {
    console.error('Error fetching knowledge items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, content, title } = await request.json();
    
    if (!userId || !content) {
      return NextResponse.json(
        { error: 'User ID and content are required' },
        { status: 400 }
      );
    }
    
    // Create the knowledge item in the database
    const knowledgeItem = await createUserKnowledgeItem(userId, content, title);
    
    // Also upsert to Pinecone for vector search
    try {
      logger.info('API', 'Upserting knowledge item to Pinecone', {
        userId,
        itemId: knowledgeItem.id,
        contentLength: content.length
      });
      
      await upsertDocuments([{
        text: content,
        source: 'user_knowledge',
        userId
      }]);
      
      logger.info('API', 'Knowledge item upserted to Pinecone');
    } catch (error) {
      logger.error('API', 'Error upserting knowledge item to Pinecone', {
        error: (error as Error).message,
        userId,
        itemId: knowledgeItem.id
      });
      // Continue even if Pinecone upsert fails
    }
    
    return NextResponse.json({ knowledgeItem }, { status: 201 });
  } catch (error) {
    console.error('Error creating knowledge item:', error);
    return NextResponse.json(
      { error: 'Failed to create knowledge item' },
      { status: 500 }
    );
  }
} 