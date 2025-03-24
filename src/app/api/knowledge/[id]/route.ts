import { NextRequest, NextResponse } from 'next/server';
import { getKnowledgeItemById, updateKnowledgeItem, deleteKnowledgeItem } from '@/lib/services/knowledgeService';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Knowledge item ID is required' },
        { status: 400 }
      );
    }
    
    const knowledgeItem = await getKnowledgeItemById(id);
    
    if (!knowledgeItem) {
      return NextResponse.json(
        { error: 'Knowledge item not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ knowledgeItem });
  } catch (error) {
    console.error('Error fetching knowledge item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge item' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Knowledge item ID is required' },
        { status: 400 }
      );
    }
    
    const { content, title } = await request.json();
    
    if (!content && !title) {
      return NextResponse.json(
        { error: 'At least one field to update is required' },
        { status: 400 }
      );
    }
    
    const knowledgeItem = await updateKnowledgeItem(id, { content, title });
    
    return NextResponse.json({ knowledgeItem });
  } catch (error) {
    console.error('Error updating knowledge item:', error);
    return NextResponse.json(
      { error: 'Failed to update knowledge item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Knowledge item ID is required' },
        { status: 400 }
      );
    }
    
    await deleteKnowledgeItem(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting knowledge item:', error);
    return NextResponse.json(
      { error: 'Failed to delete knowledge item' },
      { status: 500 }
    );
  }
} 