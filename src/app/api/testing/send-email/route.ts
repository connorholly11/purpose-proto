import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';
import { sendAiEmailToUser } from '@/lib/email';

/**
 * POST /api/testing/send-email
 * Send a test email to a user
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
    
    // In production, you might want to restrict this to admin users
    const body = await request.json();
    const { userId: targetUserId } = body;
    
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { clerkId: targetUserId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has a structured summary
    const summary = await prisma.structuredSummary.findUnique({
      where: { userId: targetUserId },
    });

    if (!summary || !summary.summaryData) {
      return NextResponse.json(
        { error: 'User does not have structured summary data' },
        { status: 400 }
      );
    }

    // Send the email
    await sendAiEmailToUser(targetUserId);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test email sent successfully' 
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json({
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}