import { NextRequest, NextResponse } from 'next/server';
import { createPromptFeedback, getPromptFeedback } from '@/lib/services/promptService';

// Get feedback for a system prompt
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'System prompt ID is required' },
        { status: 400 }
      );
    }
    
    const feedback = await getPromptFeedback(id);
    
    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error fetching prompt feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompt feedback' },
      { status: 500 }
    );
  }
}

// Create feedback for a system prompt
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const systemPromptId = params.id;
    
    if (!systemPromptId) {
      return NextResponse.json(
        { error: 'System prompt ID is required' },
        { status: 400 }
      );
    }
    
    const { rating, userId, comments } = await request.json();
    
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be a number between 1 and 5' },
        { status: 400 }
      );
    }
    
    const feedback = await createPromptFeedback(
      systemPromptId,
      rating,
      userId,
      comments
    );
    
    return NextResponse.json({ feedback }, { status: 201 });
  } catch (error) {
    console.error('Error creating prompt feedback:', error);
    return NextResponse.json(
      { error: 'Failed to create prompt feedback' },
      { status: 500 }
    );
  }
} 