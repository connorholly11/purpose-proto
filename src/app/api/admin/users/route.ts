import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

/**
 * Get all users
 * GET /api/admin/users
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

    const dbUsers = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch user email information from Clerk
    const userEmails = new Map();
    try {
      const clerkUsers = await clerkClient.users.getUserList();
      
      clerkUsers.forEach((user) => {
        if (user.emailAddresses && user.emailAddresses.length > 0) {
          const primaryEmail = user.emailAddresses.find(
            (email) => email.id === user.primaryEmailAddressId
          );
          const emailAddress = primaryEmail?.emailAddress || user.emailAddresses[0].emailAddress;
          if (emailAddress) {
            userEmails.set(user.id, emailAddress);
          }
        }
      });
    } catch (clerkError) {
      console.error('Error fetching users from Clerk:', clerkError);
    }

    const usersWithEmail = dbUsers.map((user) => ({
      ...user,
      email: userEmails.get(user.clerkId) || null,
    }));

    return NextResponse.json(usersWithEmail);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}