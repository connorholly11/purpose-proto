import OpenAI from 'openai';
import { Readable } from 'stream';
import { createReadStream } from 'fs';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Creating a singleton instance of the OpenAI client
let openaiInstance: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not defined in environment variables');
    }
    
    openaiInstance = new OpenAI({
      apiKey: apiKey,
    });
  }
  
  return openaiInstance;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAIClient();
  
  try {
    const embeddingResponse = await openai.embeddings.create({
      model: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
      input: text,
    });
    
    return embeddingResponse.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const openai = getOpenAIClient();
  
  try {
    // Create a temporary file for the audio
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `audio-${Date.now()}.webm`);
    
    // Write buffer to temporary file
    fs.writeFileSync(tempFilePath, audioBuffer);
    
    // Use the file path with OpenAI's API
    const transcription = await openai.audio.transcriptions.create({
      file: createReadStream(tempFilePath),
      model: "whisper-1",
    });
    
    // Clean up the temporary file
    fs.unlinkSync(tempFilePath);
    
    return transcription.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}

export async function generateSpeech(text: string, voice: string = 'alloy'): Promise<Buffer> {
  const openai = getOpenAIClient();
  
  try {
    const allowedVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    const selectedVoice = allowedVoices.includes(voice) ? voice : 'alloy';
    
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: selectedVoice as any,
      input: text,
    });
    
    const buffer = Buffer.from(await mp3.arrayBuffer());
    return buffer;
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
}

export async function getCompletion(messages: any[], context?: string): Promise<string> {
  const openai = getOpenAIClient();
  
  try {
    // If we have context from RAG, add it to the system message
    if (context) {
      // Find or create a system message
      const systemMessageIndex = messages.findIndex(msg => msg.role === 'system');
      
      if (systemMessageIndex >= 0) {
        // Append context to existing system message
        messages[systemMessageIndex].content += `\n\nContext:\n${context}`;
      } else {
        // Create a new system message with context
        messages.unshift({
          role: 'system',
          content: `You are a helpful assistant. Use the following context to answer accurately:\n\nContext:\n${context}`
        });
      }
    }
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
    });
    
    return completion.choices[0].message.content || '';
  } catch (error) {
    console.error('Error getting completion:', error);
    throw error;
  }
} 