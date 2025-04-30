import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { runBatchEvalTests } from '@/lib/evaluation';
import { initializeEvalProgress, createEvalProgressTracker } from '@/lib/evalProgress';

/**
 * POST /api/eval/run
 * Runs evaluations for combinations of system prompts and persona scenarios
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
    const { promptIds, personaIds, evalId, evaluationMode = "optimize_good" } = body;
    
    if (!promptIds || !personaIds || promptIds.length === 0 || personaIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing promptIds or personaIds' },
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
    
    // Calculate total expected evaluation runs
    const totalRuns = promptIds.length * personaIds.length;
    
    if (evalId) {
      initializeEvalProgress(evalId, totalRuns);
    }
    
    // Create progress tracking
    const progressTracker = evalId ? createEvalProgressTracker(evalId) : undefined;
    
    // Run the evaluations in batch with the specified mode
    const results = await runBatchEvalTests(promptIds, personaIds, progressTracker, evaluationMode);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in run evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to run evaluation tests' },
      { status: 500 }
    );
  }
}