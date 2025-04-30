import { NextRequest, NextResponse } from 'next/server';
import { getEvalProgress } from '@/lib/evalProgress';

/**
 * GET /api/eval/progress/:evalId
 * Simple polling endpoint for evaluation progress updates
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { evalId: string } }
): Promise<NextResponse> {
  const evalId = params.evalId;
  
  // Get the current progress from our module
  const progress = getEvalProgress(evalId);
  
  return NextResponse.json(progress);
}