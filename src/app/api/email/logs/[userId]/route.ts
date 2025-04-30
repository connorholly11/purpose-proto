import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { getUserEmailLogs } from '@/lib/email';

/**
 * Get email logs for a user
 * GET /api/email/logs/:userId
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
): Promise<NextResponse> {
  try {
    // Check if user is authenticated
    const { userId: authUserId } = auth();
    
    if (!authUserId) {
      return NextResponse.json(
        { error: 'Unauthorized. User not authenticated.' },
        { status: 401 }
      );
    }
    
    // If the user is trying to access someone else's logs, they should be admin 
    // (admin check would be in middleware)
    if (params.userId !== authUserId) {
      // For extra security, double check if user can access these logs
      const FOUNDER_CLERK_IDS = (process.env.FOUNDER_CLERK_IDS || '').split(',');
      const isAdmin = FOUNDER_CLERK_IDS.includes(authUserId);
      
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Forbidden. Cannot access other users\' logs.' },
          { status: 403 }
        );
      }
    }

    const logs = await getUserEmailLogs(params.userId);
    
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching email logs:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch email logs', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}