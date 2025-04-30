import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/legal/accept
 * Record the user's acceptance of the terms of service
 * Requires authentication
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
    
    const version = process.env.TERMS_VERSION || '1.0';
    
    // Check if the user has already accepted this version
    const existingAcceptance = await prisma.termsAcceptance.findFirst({
      where: {
        userId,
        version,
      },
    });
    
    if (existingAcceptance) {
      return NextResponse.json(
        { message: 'Terms already accepted', acceptedAt: existingAcceptance.acceptedAt },
        { status: 200 }
      );
    }
    
    // Create a new acceptance record
    const acceptance = await prisma.termsAcceptance.create({
      data: {
        userId,
        version,
      },
    });
    
    return NextResponse.json(
      { message: 'Terms accepted successfully', acceptedAt: acceptance.acceptedAt },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error accepting terms:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}