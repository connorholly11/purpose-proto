import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { transcribeAudio } from '@/lib/transcription';
import os from 'os';

/**
 * Transcribe audio to text using OpenAI Whisper
 * POST /api/voice/transcribe
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check if user is authenticated
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. User not authenticated.' },
        { status: 401 }
      );
    }
    
    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }
    
    // Convert to buffer for saving to a temp file
    const buffer = Buffer.from(await file.arrayBuffer());
    
    console.log(`Processing audio transcription request from user ${userId}`);
    console.log(`File details: ${JSON.stringify({
      type: file.type,
      size: buffer.length,
    })}`);
    
    // Create a temp file name in the system's temp directory
    const tempDir = os.tmpdir();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filePath = join(tempDir, `audio-${uniqueSuffix}.webm`);
    
    // Write the buffer to a temporary file
    await writeFile(filePath, buffer);
    
    // Transcribe the audio file
    const transcription = await transcribeAudio(filePath);
    
    return NextResponse.json({ transcription });
  } catch (error) {
    console.error('Error in transcribe endpoint:', error);
    return NextResponse.json({
      error: 'Failed to transcribe audio',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}