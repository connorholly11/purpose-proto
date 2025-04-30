import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

/**
 * Update feedback content
 * PUT /api/admin/feedback/:id/content
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
    const { content } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Feedback ID is required' },
        { status: 400 }
      );
    }

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Valid content is required' },
        { status: 400 }
      );
    }

    const updatedFeedback = await prisma.feedback.update({
      where: { id },
      data: { content },
    });

    return NextResponse.json(updatedFeedback);
  } catch (error) {
    console.error('Error updating feedback content:', error);
    
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      error: 'Failed to update feedback content',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}