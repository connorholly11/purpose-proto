import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { getAllSystemPrompts, createSystemPrompt } from '@/lib/prompts';

/**
 * Get all system prompts
 * GET /api/admin/system-prompts
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Check if user is authenticated (admin check should be in middleware)
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

    const prompts = await getAllSystemPrompts();
    
    return NextResponse.json(prompts);
  } catch (error) {
    console.error('Error getting all system prompts:', error);
    return NextResponse.json({
      error: 'Failed to retrieve system prompts',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

/**
 * Create a new system prompt
 * POST /api/admin/system-prompts
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
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

    const body = await request.json();
    const { name, promptText, modelName, isFavorite } = body;

    if (!name || !promptText) {
      return NextResponse.json(
        { error: 'Name and promptText are required' },
        { status: 400 }
      );
    }

    const newPrompt = await createSystemPrompt(name, promptText, modelName, isFavorite);
    
    return NextResponse.json(newPrompt, { status: 201 });
  } catch (error) {
    console.error('Error creating system prompt:', error);

    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json({
      error: 'Failed to create system prompt',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}