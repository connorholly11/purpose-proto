import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { runEvalTest } from '@/lib/evaluation';

/**
 * POST /api/eval/run-single
 * Runs a single evaluation for one system prompt and one persona scenario
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
    
    // In production, you might want to restrict this to admin users
    const FOUNDER_CLERK_IDS = (process.env.FOUNDER_CLERK_IDS || '').split(',');
    const isAdmin = FOUNDER_CLERK_IDS.includes(userId);
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { promptId, personaId, evaluationMode = "optimize_good" } = body;
    
    if (!promptId || !personaId) {
      return NextResponse.json(
        { error: 'Missing promptId or personaId' },
        { status: 400 }
      );
    }
    
    // Validate evaluationMode
    if (evaluationMode !== "optimize_good" && evaluationMode !== "avoid_bad") {
      return NextResponse.json(
        { error: 'Invalid evaluationMode, must be "optimize_good" or "avoid_bad"' },
        { status: 400 }
      );
    }
    
    // Run the single evaluation
    const result = await runEvalTest(promptId, personaId, evaluationMode);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in run single evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to run evaluation test' },
      { status: 500 }
    );
  }
}