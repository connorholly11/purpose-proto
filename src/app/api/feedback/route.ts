import { NextRequest, NextResponse } from 'next/server';
import { createFeedback, getAllFeedback } from '@/lib/services/feedbackService';

// Get all feedback (admin only)
export async function GET(request: NextRequest) {
  // Added environment var check
  if (!process.env.DATABASE_URL) {
    console.error("Warning: No DATABASE_URL found in environment. This might cause 500 errors in production.");
  }

  try {
    // In a real app, you would verify the user has admin rights here
    
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    
    let feedback;
    if (category) {
      feedback = await getAllFeedback();
    } else {
      feedback = await getAllFeedback();
    }
    
    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    // Extended error details
    console.error('Full error details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

// Create a new feedback entry
export async function POST(request: NextRequest) {
  // Added environment var check
  if (!process.env.DATABASE_URL) {
    console.error("Warning: No DATABASE_URL found in environment. This might cause 500 errors in production.");
  }

  try {
    const { category, content, userId, screenshot } = await request.json();
    
    if (!category || !content) {
      return NextResponse.json(
        { error: 'Category and content are required' },
        { status: 400 }
      );
    }
    
    const feedback = await createFeedback(category, content, userId, screenshot);
    
    return NextResponse.json({ feedback }, { status: 201 });
  } catch (error) {
    console.error('Error creating feedback:', error);
    // Extended error details
    console.error('Full error details:', error);
    return NextResponse.json(
      { error: 'Failed to create feedback' },
      { status: 500 }
    );
  }
}
