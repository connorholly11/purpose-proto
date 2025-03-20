import { NextRequest, NextResponse } from 'next/server';
import { createSystemPrompt, getAllSystemPrompts, getActiveSystemPrompt } from '@/lib/services/promptService';

// Get all system prompts
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('activeOnly') === 'true';
    
    if (activeOnly) {
      const activePrompt = await getActiveSystemPrompt();
      return NextResponse.json({ systemPrompt: activePrompt });
    } else {
      const systemPrompts = await getAllSystemPrompts();
      return NextResponse.json({ systemPrompts });
    }
  } catch (error) {
    console.error('Error fetching system prompts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system prompts' },
      { status: 500 }
    );
  }
}

// Create a new system prompt
export async function POST(request: NextRequest) {
  try {
    const { name, content, status } = await request.json();
    
    if (!name || !content) {
      return NextResponse.json(
        { error: 'Name and content are required' },
        { status: 400 }
      );
    }
    
    const systemPrompt = await createSystemPrompt(name, content, status);
    return NextResponse.json({ systemPrompt }, { status: 201 });
  } catch (error) {
    console.error('Error creating system prompt:', error);
    return NextResponse.json(
      { error: 'Failed to create system prompt' },
      { status: 500 }
    );
  }
} 