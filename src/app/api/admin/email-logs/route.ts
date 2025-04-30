import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { getAllEmailLogs } from '@/lib/email';

/**
 * Get all email logs (admin endpoint)
 * GET /api/admin/email-logs
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

    const logs = await getAllEmailLogs();
    
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching all email logs:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch all email logs', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}