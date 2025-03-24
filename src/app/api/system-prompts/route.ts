import { NextRequest, NextResponse } from 'next/server';
import {
  createSystemPrompt,
  getAllSystemPrompts,
  getActiveSystemPrompt
} from '@/lib/services/promptService';
import logger from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const activeOnly = params.get('activeOnly') === 'true';
    
    logger.info('SystemPrompts API', 'Fetching system prompts', { activeOnly });

    if (activeOnly) {
      const activePrompt = await getActiveSystemPrompt();
      return NextResponse.json({ systemPrompt: activePrompt || null });
    } else {
      const systemPrompts = await getAllSystemPrompts();
      return NextResponse.json({ systemPrompts });
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error('SystemPrompts API', 'Error fetching system prompts', { error: errorMsg });
    
    // Return empty results instead of failing with 500
    return NextResponse.json({ 
      systemPrompts: [], 
      systemPrompt: null,
      error: 'An error occurred fetching prompts. Please verify the database connection.'
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, content, status } = await request.json();
    
    logger.info('SystemPrompts API', 'Creating system prompt', { name, status });

    if (!name || !content) {
      logger.warn('SystemPrompts API', 'Missing required fields', { 
        hasName: !!name, 
        hasContent: !!content 
      });
      return NextResponse.json({ error: 'Name and content are required' }, { status: 400 });
    }

    const systemPrompt = await createSystemPrompt(name, content, status);
    logger.info('SystemPrompts API', 'System prompt created successfully', { id: systemPrompt.id });
    return NextResponse.json({ systemPrompt }, { status: 201 });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error('SystemPrompts API', 'Error creating system prompt', { error: errorMsg });
    return NextResponse.json({ 
      error: 'Failed to create system prompt. Please verify the database connection.'
    }, { status: 500 });
  }
}
