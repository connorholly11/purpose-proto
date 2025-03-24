import { NextRequest, NextResponse } from 'next/server';
import {
  createSystemPrompt,
  getAllSystemPrompts,
  getActiveSystemPrompt
} from '@/lib/services/promptService';

export async function GET(request: NextRequest) {
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
    console.error('Error fetching system prompts:', error instanceof Error ? error.stack : error);
    return NextResponse.json({ error: 'Failed to fetch system prompts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, content, status } = await request.json();

    if (!name || !content) {
      return NextResponse.json({ error: 'Name and content are required' }, { status: 400 });
    }

    const systemPrompt = await createSystemPrompt(name, content, status);
    return NextResponse.json({ systemPrompt }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating system prompt:', error instanceof Error ? error.stack : error);
    return NextResponse.json({ error: 'Failed to create system prompt' }, { status: 500 });
  }
}
