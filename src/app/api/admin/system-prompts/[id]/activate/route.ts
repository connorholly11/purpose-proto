import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { setActiveSystemPrompt, setUserActiveSystemPrompt } from '@/lib/prompts';

/**
 * Set a system prompt as active
 * PUT /api/admin/system-prompts/:id/activate
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
    
    // Optional userId in the request body to set the prompt for a specific user
    const body = await request.json();
    const { userId: targetUserId } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Prompt ID is required' },
        { status: 400 }
      );
    }

    // If targetUserId is provided, set active prompt for that user
    if (targetUserId) {
      const userActivePrompt = await setUserActiveSystemPrompt(targetUserId, id);
      return NextResponse.json(userActivePrompt);
    } else {
      // Otherwise, set as global default
      const activatedPrompt = await setActiveSystemPrompt(id);
      return NextResponse.json(activatedPrompt);
    }
  } catch (error) {
    console.error(`Error activating system prompt:`, error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({
      error: 'Failed to activate system prompt',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}