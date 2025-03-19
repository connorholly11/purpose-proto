import { NextRequest } from 'next/server';
import formidable from 'formidable';

// Helper function to convert ReadableStream to Buffer
export async function streamToBuffer(stream: ReadableStream): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  return Buffer.concat(chunks);
}

// Extract the body buffer from a NextRequest
export async function getBodyBuffer(req: NextRequest): Promise<Buffer> {
  // For multipart form data, we need to get the body as a stream
  if (req.body) {
    return streamToBuffer(req.body);
  }
  
  throw new Error('Request body is not readable');
} 