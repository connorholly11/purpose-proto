import { NextRequest, NextResponse } from 'next/server';
import { getRagOperationDetails } from '@/lib/services/ragAnalytics';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Operation ID is required' },
        { status: 400 }
      );
    }
    
    // Get operation details
    const operation = await getRagOperationDetails(id);
    
    if (!operation) {
      return NextResponse.json(
        { error: 'Operation not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(operation);
  } catch (error) {
    console.error('Error getting RAG operation details:', error);
    return NextResponse.json(
      { error: 'Error getting operation details' },
      { status: 500 }
    );
  }
} 