import { NextRequest, NextResponse } from 'next/server';
import { RealtimeSessionResponse } from '@/types';

export async function POST(req: NextRequest) {
  try {
    // Get the OpenAI API key from environment
    const openaiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiKey) {
      return NextResponse.json(
        { error: 'API key is not configured' },
        { status: 500 }
      );
    }
    
    // Extract voice parameter from the request if provided
    const body = await req.json().catch(() => ({}));
    const voice = body.voice || 'alloy';
    
    // Call OpenAI to create a realtime session
    const realtimeResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice,
      }),
    });
    
    if (!realtimeResponse.ok) {
      const errorData = await realtimeResponse.json();
      console.error('Error creating realtime session:', errorData);
      return NextResponse.json(
        { error: 'Failed to create realtime session' },
        { status: realtimeResponse.status }
      );
    }
    
    // Parse and return the response
    const data = await realtimeResponse.json();
    
    // Optional: Log the session creation in database
    // This could be useful for tracking usage statistics
    
    const response: RealtimeSessionResponse = {
      client_secret: data.client_secret,
      session_id: data.session_id,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating realtime session:', error);
    return NextResponse.json(
      { error: 'Failed to create ephemeral session' },
      { status: 500 }
    );
  }
} 