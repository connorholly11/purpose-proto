import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { getAllPersonaScenarios } from '@/lib/evaluation';

/**
 * GET /api/eval/personas
 * Returns all available persona scenarios
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Check if user is authenticated
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. User not authenticated.' },
        { status: 401 }
      );
    }
    
    // Get all persona scenarios
    const personas = await getAllPersonaScenarios();
    
    return NextResponse.json(personas);
  } catch (error) {
    console.error('Error fetching personas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch persona scenarios' },
      { status: 500 }
    );
  }
}