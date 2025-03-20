import { NextRequest, NextResponse } from 'next/server';
import {
  getSystemPromptById,
  updateSystemPrompt,
  deleteSystemPrompt,
  setActiveSystemPrompt
} from '@/lib/services/promptService';

// Get a system prompt by ID
export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = context.params;
    if (!id) {
      return NextResponse.json(
        { error: 'System prompt ID is required' },
        { status: 400 }
      );
    }

    const systemPrompt = await getSystemPromptById(id);
    if (!systemPrompt) {
      return NextResponse.json(
        { error: 'System prompt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ systemPrompt });
  } catch (error) {
    console.error('Error fetching system prompt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system prompt' },
      { status: 500 }
    );
  }
}

// Update a system prompt
export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = context.params;
    if (!id) {
      return NextResponse.json(
        { error: 'System prompt ID is required' },
        { status: 400 }
      );
    }

    const { name, content, status } = await request.json();
    if (!name && !content && !status) {
      return NextResponse.json(
        { error: 'At least one field to update is required' },
        { status: 400 }
      );
    }

    // If setting to active, use dedicated function
    if (status === 'active') {
      const systemPrompt = await setActiveSystemPrompt(id);
      return NextResponse.json({ systemPrompt });
    }

    const systemPrompt = await updateSystemPrompt(id, { name, content, status });
    return NextResponse.json({ systemPrompt });
  } catch (error) {
    console.error('Error updating system prompt:', error);
    return NextResponse.json(
      { error: 'Failed to update system prompt' },
      { status: 500 }
    );
  }
}

// Delete a system prompt
export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = context.params;
    if (!id) {
      return NextResponse.json(
        { error: 'System prompt ID is required' },
        { status: 400 }
      );
    }

    await deleteSystemPrompt(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting system prompt:', error);
    return NextResponse.json(
      { error: 'Failed to delete system prompt' },
      { status: 500 }
    );
  }
}
