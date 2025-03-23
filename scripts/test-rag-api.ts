import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define types for API responses
interface KnowledgeItemResponse {
  knowledgeItem: {
    id: string;
    userId: string;
    title?: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface RagApiResponse {
  context: string;
  matches: {
    id: string;
    score: number;
    text: string;
    source?: string;
  }[];
  operationTime: number;
}

interface KnowledgeListResponse {
  knowledgeItems: {
    id: string;
    userId: string;
    title?: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  }[];
}

// Configure these to match your environment
const TEST_USER_ID = '860577c7-2047-4ee4-85a5-1554916dfc5a';
const API_BASE_URL = 'http://localhost:3000'; // Change if using a different port

async function testRagApi() {
  try {
    console.log('🔍 Starting RAG API Test');
    console.log('------------------------------------------------');
    
    // Check if the server is running first
    try {
      console.log('🔄 Checking if server is running at ' + API_BASE_URL);
      const response = await fetch(API_BASE_URL);
      console.log(`✅ Server is running. Status: ${response.status}`);
    } catch (error) {
      console.error(`❌ Error connecting to server at ${API_BASE_URL}`);
      console.error('Make sure your Next.js development server is running!');
      console.error('Run this command in another terminal: npm run dev');
      return;
    }
    
    // 1. First add a knowledge item
    console.log('\n📝 Step 1: Adding knowledge item via API...');
    const knowledgeData = {
      userId: TEST_USER_ID,
      content: 'My name is Connor and I work on RAG systems',
      title: 'API Test Knowledge'
    };
    
    try {
      const addResponse = await fetch(`${API_BASE_URL}/api/knowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': TEST_USER_ID
        },
        body: JSON.stringify(knowledgeData)
      });
      
      if (!addResponse.ok) {
        const responseText = await addResponse.text();
        console.error(`❌ Failed to add knowledge item: ${addResponse.status} ${addResponse.statusText}`);
        console.error('Response:', responseText.substring(0, 200) + '...');
        console.error('\nResponse Headers:');
        addResponse.headers.forEach((value, name) => {
          console.error(`${name}: ${value}`);
        });
        
        throw new Error(`API request failed with status ${addResponse.status}`);
      }
      
      const knowledgeResult = await addResponse.json() as KnowledgeItemResponse;
      console.log(`✅ Added knowledge item with ID: ${knowledgeResult.knowledgeItem.id}`);
      
      // Give Pinecone a moment to process
      console.log('⏳ Waiting 3 seconds for indexing...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 2. Test RAG API with different queries
      console.log('\n🔄 Step 2: Testing RAG API with queries...');
      const queries = [
        'What is my name?',
        'Who am I?',
        'What do I do?',
        'Do you know my name?',
        'Connor'
      ];
      
      for (const query of queries) {
        console.log(`\n📝 Testing query: "${query}"`);
        
        try {
          const ragResponse = await fetch(`${API_BASE_URL}/api/rag`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': TEST_USER_ID
            },
            body: JSON.stringify({
              query,
              topK: 5,
              source: 'test_script'
            })
          });
          
          if (!ragResponse.ok) {
            const responseText = await ragResponse.text();
            console.error(`❌ RAG API request failed: ${ragResponse.status} ${ragResponse.statusText}`);
            console.error('Response:', responseText.substring(0, 200) + '...');
            console.error('\nResponse Headers:');
            ragResponse.headers.forEach((value, name) => {
              console.error(`${name}: ${value}`);
            });
            continue;
          }
          
          const ragResult = await ragResponse.json() as RagApiResponse;
          console.log(`✅ RAG API response received in ${ragResult.operationTime}ms`);
          console.log(`📊 Found ${ragResult.matches?.length || 0} matches`);
          
          if (ragResult.matches && ragResult.matches.length > 0) {
            console.log('\n🔍 Matches:');
            ragResult.matches.forEach((match, i) => {
              console.log(`\n[Match ${i+1}] Score: ${match.score?.toFixed(4)}`);
              console.log(`Text: "${match.text}"`);
              console.log(`Source: ${match.source || 'None'}`);
            });
            
            const hasNameMatch = ragResult.matches.some(match => 
              match.text.toLowerCase().includes('connor') && 
              match.score > 0.7
            );
            
            if (hasNameMatch) {
              console.log('\n✅ SUCCESS: Found name "Connor" in results with good score');
            } else {
              console.log('\n❌ FAIL: Did not find name "Connor" in results with good score');
            }
          } else {
            console.log('❌ No matches found');
          }
          
          console.log('\nContext used for completion:');
          console.log(ragResult.context || 'No context provided');
        } catch (error) {
          console.error(`❌ Error with query "${query}":`, error);
        }
      }
      
      // 3. Get knowledge items via API
      console.log('\n🔄 Step 3: Fetching knowledge items via API...');
      try {
        const knowledgeListResponse = await fetch(
          `${API_BASE_URL}/api/knowledge?userId=${TEST_USER_ID}`,
          {
            headers: {
              'x-user-id': TEST_USER_ID
            }
          }
        );
        
        if (!knowledgeListResponse.ok) {
          const responseText = await knowledgeListResponse.text();
          console.error(`❌ Failed to fetch knowledge items: ${knowledgeListResponse.status}`);
          console.error('Response:', responseText.substring(0, 200) + '...');
          console.error('\nResponse Headers:');
          knowledgeListResponse.headers.forEach((value, name) => {
            console.error(`${name}: ${value}`);
          });
        } else {
          const knowledgeList = await knowledgeListResponse.json() as KnowledgeListResponse;
          console.log(`✅ Retrieved ${knowledgeList.knowledgeItems?.length || 0} knowledge items`);
          
          if (knowledgeList.knowledgeItems?.length > 0) {
            knowledgeList.knowledgeItems.forEach((item, i) => {
              console.log(`\n[Item ${i+1}] ID: ${item.id}`);
              console.log(`Title: ${item.title || 'Untitled'}`);
              console.log(`Content: ${item.content}`);
            });
          }
        }
      } catch (error) {
        console.error('❌ Error fetching knowledge items:', error);
      }
    } catch (error) {
      console.error('❌ Error adding knowledge item:', error);
    }
    
    console.log('\n------------------------------------------------');
    console.log('🏁 RAG API testing complete');
    
  } catch (error) {
    console.error('❌ Error during RAG API test:', error);
  }
}

// Run the test
testRagApi().catch(console.error);