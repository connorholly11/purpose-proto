import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

/**
 * Update feedback status
 * PUT /api/admin/feedback/:id
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
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

    const id = params.id;
    const body = await request.json();
    const { status } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Feedback ID is required' },
        { status: 400 }
      );
    }

    if (!status || !['new', 'reviewed', 'resolved'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (new, reviewed, resolved)' },
        { status: 400 }
      );
    }

    const updatedFeedback = await prisma.feedback.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updatedFeedback);
  } catch (error) {
    console.error('Error updating feedback status:', error);
    
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      error: 'Failed to update feedback status',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}