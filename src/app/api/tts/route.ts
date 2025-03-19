import { NextRequest, NextResponse } from 'next/server';
import { generateSpeech } from '@/lib/services/openai';
import { TTSRequest, TTSResponse } from '@/types';

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json() as TTSRequest;
    const { text, voice = 'alloy' } = body;
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request, text is required' },
        { status: 400 }
      );
    }
    
    // Generate speech
    const audioBuffer = await generateSpeech(text, voice);
    
    // Convert to base64 for response
    const base64Audio = audioBuffer.toString('base64');
    
    // Return the audio content
    const response: TTSResponse = { audioContent: base64Audio };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating speech:', error);
    return NextResponse.json(
      { error: 'Error generating speech' },
      { status: 500 }
    );
  }
}

// Alternative implementation that returns the audio file directly
export async function GET(req: NextRequest) {
  try {
    // Get text from URL params
    const text = req.nextUrl.searchParams.get('text');
    const voice = req.nextUrl.searchParams.get('voice') || 'alloy';
    
    if (!text) {
      return NextResponse.json(
        { error: 'Invalid request, text parameter is required' },
        { status: 400 }
      );
    }
    
    // Generate speech
    const audioBuffer = await generateSpeech(text, voice);
    
    // Return as audio file
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating speech:', error);
    return NextResponse.json(
      { error: 'Error generating speech' },
      { status: 500 }
    );
  }
} 