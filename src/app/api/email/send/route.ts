import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';
import { sendAiEmailToUser } from '@/lib/email';

/**
 * Send an AI-generated email to a user
 * POST /api/email/send
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check if user is authenticated (admin check should be in middleware)
    const { userId: authUserId } = auth();
    
    if (!authUserId) {
      return NextResponse.json(
        { error: 'Unauthorized. User not authenticated.' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { userId, email } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    await sendAiEmailToUser(userId, email);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Email sent successfully' 
    });
  } catch (error) {
    console.error('Error sending AI-based email:', error);
    return NextResponse.json({ 
      error: 'Failed to send AI-based email', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}