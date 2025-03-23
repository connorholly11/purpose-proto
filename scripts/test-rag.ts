// Required to resolve @/ imports
require('./aliases');

import * as dotenv from 'dotenv';

// Direct imports that use the module aliases
import { createUserKnowledgeItem } from '@/lib/services/knowledgeService';
import { upsertDocuments, queryDocuments } from '@/lib/services/pinecone';
import logger from '@/lib/utils/logger';

// Load environment variables
dotenv.config();

// Configure this to match your test user ID
const TEST_USER_ID = '860577c7-2047-4ee4-85a5-1554916dfc5a';

async function testRagSystem() {
  try {
    console.log('⚡ Starting RAG system test');
    console.log('------------------------------------------------');
    
    // Step 1: Add a test knowledge item
    const testContent = 'My name is Connor and I live in California';
    console.log(`📝 Adding test knowledge item: "${testContent}"`);
    
    // Add to the database
    const knowledgeItem = await createUserKnowledgeItem(
      TEST_USER_ID, 
      testContent,
      'Test Knowledge'
    );
    console.log(`✅ Added to database with ID: ${knowledgeItem.id}`);
    
    // Step 2: Upsert to Pinecone
    console.log('🔄 Upserting to Pinecone vector database...');
    await upsertDocuments([{
      text: testContent,
      source: 'test_script',
      userId: TEST_USER_ID
    }]);
    console.log('✅ Upserted to Pinecone');
    
    // Give Pinecone a moment to process
    console.log('⏳ Waiting 3 seconds for indexing...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 3: Test retrieval with different queries
    const testQueries = [
      'What is my name?',
      'Who am I?',
      'Where do I live?',
      'Tell me about Connor',
      'Do you know my name?',
    ];
    
    console.log('🔍 Testing retrieval with different queries:');
    console.log('------------------------------------------------');
    
    for (const query of testQueries) {
      console.log(`\nQuery: "${query}"`);
      try {
        const startTime = Date.now();
        const results = await queryDocuments(query, 5, TEST_USER_ID);
        const duration = Date.now() - startTime;
        
        console.log(`⏱️  Retrieved in ${duration}ms`);
        console.log(`📊 Found ${results.length} matches:`);
        
        results.forEach((match: any, i: number) => {
          console.log(`\n[Match ${i+1}] Score: ${match.score.toFixed(4)}`);
          console.log(`Content: "${match.content}"`);
          console.log(`Source: ${match.metadata?.source || 'unknown'}`);
          console.log(`User ID: ${match.metadata?.userId || 'none'}`);
        });
        
        const hasNameMatch = results.some((match: any) => 
          match.content.toLowerCase().includes('connor') && 
          match.score > 0.7
        );
        
        if (hasNameMatch) {
          console.log('\n✅ SUCCESS: Found name "Connor" in results with good score');
        } else {
          console.log('\n❌ FAIL: Did not find name "Connor" in results with good score');
        }
      } catch (error) {
        console.error(`❌ Error processing query "${query}":`, error);
      }
    }
    
    console.log('\n------------------------------------------------');
    console.log('🏁 RAG testing complete');
    
  } catch (error) {
    console.error('❌ Error during RAG test:', error);
  }
}

// Run the test
testRagSystem().catch(console.error); 