import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import os from 'os';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Transcribes audio file using OpenAI's Whisper API
 * @param file The audio file to transcribe, either as a Buffer or a file path
 * @returns The transcribed text
 */
export async function transcribeAudio(file: Buffer | string): Promise<string> {
  let filePath: string | null = null;
  
  try {
    // If we received a Buffer, we need to save it to a temporary file
    if (Buffer.isBuffer(file)) {
      const tempDir = os.tmpdir();
      filePath = path.join(tempDir, `audio_${Date.now()}.webm`);
      
      // Save the buffer to a temporary file
      fs.writeFileSync(filePath, file);
      console.log(`Saved audio buffer to temporary file: ${filePath}`);
    } else {
      // We received a file path
      filePath = file;
    }
    
    console.log(`Transcribing audio file at ${filePath}`);
    
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath) as any,
      model: 'whisper-1',
    });
    
    console.log('Transcription successful');
    return response.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  } finally {
    // Clean up the temporary file if we created one
    if (filePath && Buffer.isBuffer(file)) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted temporary file: ${filePath}`);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up temporary file:', cleanupError);
      }
    }
  }
}