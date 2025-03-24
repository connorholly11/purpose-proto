import { NextRequest, NextResponse } from 'next/server';
import {
  createSystemPrompt,
  getAllSystemPrompts,
  getActiveSystemPrompt
} from '@/lib/services/promptService';

export async function GET(request: NextRequest) {
  // Added environment var check
  if (!process.env.DATABASE_URL) {
    console.error("Warning: No DATABASE_URL found in environment. This might cause 500 errors in production.");
  }

  try {
    const params = request.nextUrl.searchParams;
    const activeOnly = params.get('activeOnly') === 'true';

    if (activeOnly) {
      const activePrompt = await getActiveSystemPrompt();
      return NextResponse.json({ systemPrompt: activePrompt || null });
    } else {
      const systemPrompts = await getAllSystemPrompts();
      return NextResponse.json({ systemPrompts });
    }
  } catch (error: unknown) {
    console.error('Error fetching system prompts:', error);
    // Extended error details
    console.error('Full error details:', error);
    return NextResponse.json({ error: 'Failed to fetch system prompts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Added environment var check
  if (!process.env.DATABASE_URL) {
    console.error("Warning: No DATABASE_URL found in environment. This might cause 500 errors in production.");
  }

  try {
    const { name, content, status } = await request.json();

    if (!name || !content) {
      return NextResponse.json({ error: 'Name and content are required' }, { status: 400 });
    }

    const systemPrompt = await createSystemPrompt(name, content, status);
    return NextResponse.json({ systemPrompt }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating system prompt:', error);
    // Extended error details
    console.error('Full error details:', error);
    return NextResponse.json({ error: 'Failed to create system prompt' }, { status: 500 });
  }
}
