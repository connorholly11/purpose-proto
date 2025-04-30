import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

/**
 * Get user history
 * GET /api/admin/history?userId=...
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
    
    // Admin check
    const FOUNDER_CLERK_IDS = (process.env.FOUNDER_CLERK_IDS || '').split(',');
    const isAdmin = FOUNDER_CLERK_IDS.includes(userId);
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      );
    }

    // Get user ID from query params
    const url = new URL(request.url);
    const targetUserId = url.searchParams.get('userId');

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    const messages = await prisma.message.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching user history:', error);
    return NextResponse.json({
      error: 'Failed to fetch user history',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}