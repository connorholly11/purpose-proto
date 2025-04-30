import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/legal/acceptance
 * Check if the user has accepted the current terms
 * Requires authentication
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. User not authenticated.' },
        { status: 401 }
      );
    }
    
    const version = process.env.TERMS_VERSION || '1.0';
    
    // Check if the user has accepted the current version
    const acceptance = await prisma.termsAcceptance.findFirst({
      where: {
        userId,
        version,
      },
    });
    
    return NextResponse.json({
      hasAccepted: !!acceptance,
      acceptedAt: acceptance?.acceptedAt || null,
      currentVersion: version
    });
  } catch (error) {
    console.error('Error checking terms acceptance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}