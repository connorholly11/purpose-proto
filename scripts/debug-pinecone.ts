// Required to resolve @/ imports
require('./aliases');

import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Direct imports that use the module aliases
import { generateEmbedding } from '@/lib/services/openai';
import { getUserKnowledgeItems } from '@/lib/services/knowledgeService';
import logger from '@/lib/utils/logger';

// Load environment variables
dotenv.config();

// Helper function to import modules directly from files
async function importModule(relativePath: string) {
  const fullPath = path.resolve(__dirname, relativePath);
  console.log(`Attempting to import from: ${fullPath}`);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`File does not exist: ${fullPath}`);
    throw new Error(`File does not exist: ${fullPath}`);
  }
  
  // Read the file contents
  const fileContent = fs.readFileSync(fullPath, 'utf8');
  
  // Basic check to see if it's a valid module
  if (!fileContent.includes('export')) {
    console.error(`File does not contain exports: ${fullPath}`);
    throw new Error(`File does not contain exports: ${fullPath}`);
  }
  
  return require(fullPath);
}

// Configure this to match your test user ID
const TEST_USER_ID = '860577c7-2047-4ee4-85a5-1554916dfc5a';

async function debugPinecone() {
  try {
    console.log('🔍 Starting Pinecone Debug');
    console.log('------------------------------------------------');
    
    console.log('🔄 Importing required modules...');
    // Dynamically import the modules
    const openaiModule = await importModule('../src/lib/services/openai.ts');
    const knowledgeServiceModule = await importModule('../src/lib/services/knowledgeService.ts');
    
    const { generateEmbedding } = openaiModule;
    const { getUserKnowledgeItems } = knowledgeServiceModule;
    
    console.log('✅ Successfully imported modules');
    
    // 1. Validate environment variables
    const apiKey = process.env.PINECONE_API_KEY;
    const host = process.env.PINECONE_HOST;
    const indexName = process.env.PINECONE_INDEX;
    
    if (!apiKey || !host || !indexName) {
      console.error('❌ Missing Pinecone environment variables. Check your .env file.');
      console.log('Required variables: PINECONE_API_KEY, PINECONE_HOST, PINECONE_INDEX');
      return;
    }
    
    console.log('✅ Environment variables found');
    
    // 2. Initialize Pinecone client
    console.log('🔄 Initializing Pinecone client...');
    const pinecone = new Pinecone({ apiKey });
    console.log('✅ Pinecone client initialized');
    
    // 3. Connect to index
    console.log(`🔄 Connecting to index "${indexName}"...`);
    const index = pinecone.index(indexName);
    console.log('✅ Connected to index');
    
    // 4. Fetch stats to verify connection
    console.log('🔄 Fetching index stats...');
    const stats = await index.describeIndexStats();
    console.log('✅ Index stats retrieved:');
    console.log(`  - Total vector count: ${stats.totalRecordCount}`);
    console.log(`  - Dimensions: ${stats.dimension}`);
    
    // 5. Test querying with user data
    console.log('\n🔄 Testing query for user data...');
    const queries = [
      'What is my name?',
      'My name is',
      'Connor',
      'Do you know my name?'
    ];
    
    for (const query of queries) {
      console.log(`\n📝 Testing query: "${query}"`);
      
      try {
        // Generate embedding for query
        console.log('🔄 Generating embedding...');
        const queryEmbedding = await generateEmbedding(query);
        console.log(`✅ Generated embedding of length ${queryEmbedding.length}`);
        
        // Prepare filter for user-specific data
        const filter = {
          $or: [
            { userId: { $eq: TEST_USER_ID } },
            { userId: { $exists: false } }
          ]
        };
        
        // Query Pinecone
        console.log('🔄 Querying Pinecone...');
        const queryResponse = await index.query({
          vector: queryEmbedding,
          topK: 5,
          includeMetadata: true,
          filter,
        });
        
        console.log(`✅ Query complete, found ${queryResponse.matches?.length || 0} matches`);
        
        // Display matches
        if (queryResponse.matches && queryResponse.matches.length > 0) {
          queryResponse.matches.forEach((match: any, i: number) => {
            console.log(`\n[Match ${i+1}] Score: ${match.score?.toFixed(4)}`);
            console.log(`Text: ${match.metadata?.text || 'No text'}`);
            console.log(`User ID: ${match.metadata?.userId || 'None'}`);
            console.log(`Source: ${match.metadata?.source || 'None'}`);
          });
        } else {
          console.log('❌ No matches found');
        }
      } catch (error) {
        console.error(`❌ Error processing query "${query}":`, error);
      }
    }
    
    // 6. Also check user knowledge items in database
    try {
      console.log('\n🔄 Checking user knowledge items in database...');
      const userKnowledgeItems = await getUserKnowledgeItems(TEST_USER_ID);
      
      if (userKnowledgeItems.length > 0) {
        console.log(`✅ Found ${userKnowledgeItems.length} knowledge items for user ${TEST_USER_ID}:`);
        userKnowledgeItems.forEach((item: any, i: number) => {
          console.log(`\n[Item ${i+1}] ID: ${item.id}`);
          console.log(`Title: ${item.title || 'Untitled'}`);
          console.log(`Content: ${item.content}`);
          console.log(`Created: ${item.createdAt}`);
        });
      } else {
        console.log(`❌ No knowledge items found for user ${TEST_USER_ID}`);
      }
    } catch (error) {
      console.error('❌ Error fetching knowledge items:', error);
    }
    
    console.log('\n------------------------------------------------');
    console.log('🏁 Pinecone debugging complete');
    
  } catch (error) {
    console.error('❌ Error during Pinecone debugging:', error);
  }
}

// Run the debug
debugPinecone().catch(console.error); 