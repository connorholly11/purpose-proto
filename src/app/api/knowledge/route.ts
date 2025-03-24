import { NextRequest, NextResponse } from 'next/server';
import { createUserKnowledgeItem, getUserKnowledgeItems } from '@/lib/services/knowledgeService';
import { upsertDocuments } from '@/lib/services/pinecone';
import logger from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    // Get userId from query params or headers
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || request.headers.get('x-user-id') || '';
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required in query parameters or x-user-id header' },
        { status: 400 }
      );
    }
    
    const knowledgeItems = await getUserKnowledgeItems(userId);
    logger.info('API', 'Knowledge items fetched', { 
      userId, 
      count: knowledgeItems.length 
    });
    
    return NextResponse.json({ knowledgeItems });
  } catch (error) {
    logger.error('API', 'Error fetching knowledge items', {
      error: (error as Error).message
    });
    
    return NextResponse.json(
      { error: 'Failed to fetch knowledge items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get userId from body or headers
    const body = await request.json();
    const userId = body.userId || request.headers.get('x-user-id') || '';
    const { content, title, type = 'user_knowledge' } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required in request body or x-user-id header' },
        { status: 400 }
      );
    }
    
    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }
    
    // Create the knowledge item in the database
    const knowledgeItem = await createUserKnowledgeItem(userId, content, title);
    
    logger.info('API', 'Knowledge item created in database', {
      userId,
      itemId: knowledgeItem.id,
      contentLength: content.length,
      type
    });
    
    // Also upsert to Pinecone for vector search
    try {
      logger.info('API', 'Upserting knowledge item to Pinecone', {
        userId,
        itemId: knowledgeItem.id,
        contentLength: content.length
      });
      
      await upsertDocuments([{
        text: content,
        source: type || 'user_knowledge',
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
    logger.error('API', 'Error creating knowledge item', {
      error: (error as Error).message
    });
    
    return NextResponse.json(
      { error: 'Failed to create knowledge item' },
      { status: 500 }
    );
  }
} 