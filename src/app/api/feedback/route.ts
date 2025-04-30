import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

/**
 * Create new feedback
 * POST /api/feedback
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. User not authenticated.' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { category, content } = body;

    if (!category || !content) {
      return NextResponse.json(
        { error: 'Category and content are required' },
        { status: 400 }
      );
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId,
        category,
        content,
        status: 'new',
      },
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error('Error creating feedback:', error);
    return NextResponse.json(
      {
        error: 'Failed to create feedback',
        details: error instanceof Error ? error.message : String(error),
      }, 
      { status: 500 }
    );
  }
}