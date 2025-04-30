import { NextRequest, NextResponse } from 'next/server';
import { getTestProgress } from '@/lib/testProgress';

/**
 * GET /api/testing/progress/:testId
 * Simple polling endpoint for test progress updates
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { testId: string } }
): Promise<NextResponse> {
  const testId = params.testId;
  
  // Get the current progress from our module
  const progress = getTestProgress(testId);
  
  return NextResponse.json(progress);
}