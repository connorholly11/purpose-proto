import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

/**
 * Get summarization logs
 * GET /api/admin/summarization-logs?userId=...&status=...
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

    // Get filter parameters from query
    const url = new URL(request.url);
    const targetUserId = url.searchParams.get('userId');
    const status = url.searchParams.get('status');

    const whereClause: any = {};
    if (targetUserId) whereClause.userId = targetUserId;
    if (status) whereClause.status = status;

    const logs = await prisma.summarizationLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching summarization logs:', error);
    return NextResponse.json({
      error: 'Failed to fetch summarization logs',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}