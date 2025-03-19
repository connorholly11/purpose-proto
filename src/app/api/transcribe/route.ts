import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/services/openai';
import { TranscriptionResponse } from '@/types';
import { getBodyBuffer } from '@/utils/formDataParser';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import * as fs from 'fs';

// Disable the default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    if (!req.body) {
      return NextResponse.json(
        { error: 'No form data provided' },
        { status: 400 }
      );
    }

    // We need to get the audio data from the request
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No audio file found in request' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Transcribe the audio
    const transcript = await transcribeAudio(buffer);

    // Return the transcript
    const response: TranscriptionResponse = { transcript };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return NextResponse.json(
      { error: 'Error transcribing audio' },
      { status: 500 }
    );
  }
} 