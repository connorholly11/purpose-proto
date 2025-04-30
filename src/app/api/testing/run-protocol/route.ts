import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { runProtocolTest } from '@/lib/testing';
import { initializeTestProgress, createProgressTracker } from '@/lib/testProgress';

/**
 * POST /api/testing/run-protocol
 * For the "4x4x4" style tests or other structured test protocols
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
    const { promptIds, protocolType, testId } = body;
    
    // Validate input
    if (!promptIds || !Array.isArray(promptIds) || promptIds.length === 0) {
      return NextResponse.json(
        { error: 'promptIds array is required' },
        { status: 400 }
      );
    }
    
    if (!protocolType) {
      return NextResponse.json(
        { error: 'protocolType is required' },
        { status: 400 }
      );
    }
    
    // Calculate total expected API calls for 4x4x4 protocol (12 messages)
    const totalCalls = protocolType === '4x4x4' ? promptIds.length * 12 : 0;
    
    if (testId && totalCalls > 0) {
      initializeTestProgress(testId, totalCalls);
    }
    
    // Create progress tracking
    const progressTracker = testId ? createProgressTracker(testId) : undefined;
    
    const results = await runProtocolTest(promptIds, protocolType, progressTracker);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in run-protocol:', error);
    return NextResponse.json(
      { error: 'Failed to run protocol test' },
      { status: 500 }
    );
  }
}