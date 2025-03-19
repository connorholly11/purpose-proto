import * as dotenv from 'dotenv';
import { upsertDocuments } from '../src/lib/services/pinecone';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Load environment variables
dotenv.config();

// Utility function to split text into chunks
function chunkText(text: string, chunkSize: number = 500): string[] {
  // If text is shorter than chunkSize, return it as a single chunk
  if (text.length <= chunkSize) {
    return [text];
  }
  
  const chunks: string[] = [];
  let startIndex = 0;
  
  while (startIndex < text.length) {
    // Find a good breakpoint (end of sentence or paragraph)
    let endIndex = startIndex + chunkSize;
    if (endIndex >= text.length) {
      endIndex = text.length;
    } else {
      // Look backward from endIndex to find sentence ending (.!?)
      const maxLookback = 100; // Don't look back more than 100 chars
      let lookback = 0;
      let foundBreak = false;
      
      while (lookback < maxLookback && !foundBreak && endIndex - lookback > startIndex) {
        const char = text[endIndex - lookback];
        if (['.', '!', '?', '\n'].includes(char)) {
          endIndex = endIndex - lookback + 1; // Include the punctuation
          foundBreak = true;
        }
        lookback++;
      }
      
      // If no good breakpoint found, just use the chunk size
      if (!foundBreak) {
        endIndex = startIndex + chunkSize;
      }
    }
    
    // Add the chunk
    chunks.push(text.substring(startIndex, endIndex).trim());
    startIndex = endIndex;
  }
  
  return chunks;
}

// Function to read and process files
async function processFile(filePath: string, source: string): Promise<{ text: string; source: string }[]> {
  const content = fs.readFileSync(filePath, 'utf8');
  const chunks = chunkText(content);
  
  return chunks.map(chunk => ({
    text: chunk,
    source: `${source}:${path.basename(filePath)}`,
  }));
}

// Process a path (file or directory)
async function processPath(inputPath: string): Promise<void> {
  try {
    const stats = fs.statSync(inputPath);
    let documents: { text: string; source: string }[] = [];
    
    if (stats.isDirectory()) {
      console.log(`Processing directory: ${inputPath}`);
      const files = fs.readdirSync(inputPath);
      
      for (const file of files) {
        // Only process text files
        if (file.endsWith('.md') || file.endsWith('.txt') || file.endsWith('.json')) {
          console.log(`Processing file: ${file}`);
          const filePath = path.join(inputPath, file);
          const chunks = await processFile(filePath, inputPath);
          documents = [...documents, ...chunks];
        }
      }
    } else {
      console.log(`Processing file: ${inputPath}`);
      const chunks = await processFile(inputPath, path.dirname(inputPath));
      documents = [...documents, ...chunks];
    }
    
    console.log(`Chunked into ${documents.length} documents. Uploading to Pinecone...`);
    
    if (documents.length > 0) {
      // Process in batches to avoid rate limits
      const batchSize = 50;
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        console.log(`Uploading batch ${i / batchSize + 1} of ${Math.ceil(documents.length / batchSize)}...`);
        await upsertDocuments(batch);
      }
      
      console.log('Upload complete!');
    } else {
      console.log('No documents found to process.');
    }
  } catch (error) {
    console.error('Error processing documents:', error);
    process.exit(1);
  }
}

// Main function
async function main() {
  // Check if a path was provided as a command-line argument
  const providedPath = process.argv[2];
  
  if (providedPath) {
    await processPath(providedPath);
    process.exit(0);
  } else {
    // If no path provided, prompt user for input
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    rl.question('Enter the directory or file path to ingest: ', async (inputPath) => {
      try {
        await processPath(inputPath);
      } finally {
        rl.close();
        process.exit(0);
      }
    });
  }
}

main().catch(error => {
  console.error('Error in main function:', error);
  process.exit(1);
}); 