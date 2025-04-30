import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { updateSystemPrompt, deleteSystemPrompt } from '@/lib/prompts';

/**
 * Update an existing system prompt
 * PUT /api/admin/system-prompts/:id
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // Check if user is authenticated
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. User not authenticated.' },
        { status: 401 }
      );
    }
    
    // Admin check
    const FOUNDER_CLERK_IDS = (process.env.FOUNDER_CLERK_IDS || '').split(',');
    const isAdmin = FOUNDER_CLERK_IDS.includes(userId);
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      );
    }

    const id = params.id;
    const body = await request.json();
    const { name, promptText, modelName, isFavorite } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Prompt ID is required' },
        { status: 400 }
      );
    }

    if (!name && !promptText && !modelName && isFavorite === undefined) {
      return NextResponse.json(
        { error: 'At least one of name, promptText, modelName, or isFavorite must be provided' },
        { status: 400 }
      );
    }

    const updateData: { name?: string; promptText?: string; modelName?: string; isFavorite?: boolean } = {};
    if (name !== undefined) updateData.name = name;
    if (promptText !== undefined) updateData.promptText = promptText;
    if (modelName !== undefined) updateData.modelName = modelName;
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite;

    const updatedPrompt = await updateSystemPrompt(id, updateData);
    
    return NextResponse.json(updatedPrompt);
  } catch (error) {
    console.error(`Error updating system prompt:`, error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json({
      error: 'Failed to update system prompt',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

/**
 * Delete a system prompt
 * DELETE /api/admin/system-prompts/:id
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // Check if user is authenticated
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. User not authenticated.' },
        { status: 401 }
      );
    }
    
    // Admin check
    const FOUNDER_CLERK_IDS = (process.env.FOUNDER_CLERK_IDS || '').split(',');
    const isAdmin = FOUNDER_CLERK_IDS.includes(userId);
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      );
    }

    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { error: 'Prompt ID is required' },
        { status: 400 }
      );
    }

    await deleteSystemPrompt(id);
    
    return NextResponse.json(
      { success: true, message: 'System prompt deleted successfully' }
    );
  } catch (error) {
    console.error(`Error deleting system prompt:`, error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
      
      if (error.message.includes('Cannot delete the active')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      error: 'Failed to delete system prompt',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}