import { NextRequest, NextResponse } from 'next/server';
import { getRagAnalytics } from '@/lib/services/ragAnalytics';

export async function GET(req: NextRequest) {
  try {
    // Get userId from query params if provided
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    
    // Get RAG analytics data
    const analytics = await getRagAnalytics(userId || undefined);
    
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error getting RAG analytics:', error);
    return NextResponse.json(
      { error: 'Error getting RAG analytics' },
      { status: 500 }
    );
  }
} 