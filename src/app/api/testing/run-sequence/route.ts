import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { runSingleSequenceTest } from '@/lib/testing';
import { initializeTestProgress, createProgressTracker } from '@/lib/testProgress';

/**
 * POST /api/testing/run-sequence
 * Takes a list of systemPromptIds and a custom sequence of user messages
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
    const body = await request.json();
    const { promptIds, messages, testId } = body;
    
    // Validate input
    if (!promptIds || !Array.isArray(promptIds) || promptIds.length === 0) {
      return NextResponse.json(
        { error: 'promptIds array is required' },
        { status: 400 }
      );
    }
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'messages array is required' },
        { status: 400 }
      );
    }
    
    // Calculate total expected API calls and initialize progress
    const totalCalls = promptIds.length * messages.length;
    
    if (testId) {
      initializeTestProgress(testId, totalCalls);
    }
    
    // Create progress tracking
    const progressTracker = testId ? createProgressTracker(testId) : undefined;
    
    const results = await runSingleSequenceTest(promptIds, messages, progressTracker);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in run-sequence:', error);
    return NextResponse.json(
      { error: 'Failed to run sequence test' },
      { status: 500 }
    );
  }
}