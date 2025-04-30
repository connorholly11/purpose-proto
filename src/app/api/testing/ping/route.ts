import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/testing/ping
 * Simple endpoint to verify backend connectivity
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({ 
    ok: true, 
    time: Date.now(),
    env: process.env.NODE_ENV || 'development' 
  });
}