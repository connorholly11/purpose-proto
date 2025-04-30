import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';
import { updateUserContext } from '@/lib/memory';

/**
 * Generate or update a user's summary
 * POST /api/admin/generate-summary
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
    
    // Admin check
    const FOUNDER_CLERK_IDS = (process.env.FOUNDER_CLERK_IDS || '').split(',');
    const isAdmin = FOUNDER_CLERK_IDS.includes(userId);
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId: targetUserId } = body;
    const trigger = 'manual_admin';

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: targetUserId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log(`Manually triggering context update for user ${targetUserId}`);
    const updatedSummary = await updateUserContext(targetUserId, trigger);
    
    return NextResponse.json({ 
      success: true, 
      summary: updatedSummary 
    });
  } catch (error) {
    console.error('Error triggering manual context update:', error);
    return NextResponse.json({
      error: 'Failed to trigger context update',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}