const axios = require('axios');

const API_URL = 'http://localhost:3003';

// Test the chat endpoint
async function testChat() {
  try {
    console.log('Testing chat endpoint...');
    const response = await axios.post(`${API_URL}/api/chat`, {
      message: 'What is artificial intelligence?',
      systemPromptMode: 'challenging',
      chosenLLM: 'openai'
    });
    
    console.log('Chat Response:');
    console.log(`ID: ${response.data.id}`);
    console.log(`LLM Used: ${response.data.llmUsed}`);
    console.log(`Response: ${response.data.response}`);
    console.log('-----------------------------------');
    
    return response.data.id;
  } catch (error) {
    console.error('Error testing chat endpoint:', error.message);
  }
}

// Test the logs endpoint
async function testLogs() {
  try {
    console.log('Testing logs endpoint...');
    const response = await axios.get(`${API_URL}/api/logs`);
    
    console.log('Logs:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('-----------------------------------');
  } catch (error) {
    console.error('Error testing logs endpoint:', error.message);
  }
}

// Test the rate endpoint
async function testRate(id) {
  try {
    console.log(`Testing rate endpoint for ID: ${id}...`);
    const response = await axios.post(`${API_URL}/api/rate`, {
      id,
      rating: true
    });
    
    console.log('Rate Response:');
    console.log(response.data);
    console.log('-----------------------------------');
  } catch (error) {
    console.error('Error testing rate endpoint:', error.message);
  }
}

// Test the TTS endpoint
async function testTTS() {
  try {
    console.log('Testing TTS endpoint...');
    const response = await axios.post(`${API_URL}/api/tts`, {
      text: 'This is a test for text-to-speech functionality.'
    });
    
    console.log('TTS Response:');
    console.log(response.data);
    console.log('-----------------------------------');
  } catch (error) {
    console.error('Error testing TTS endpoint:', error.message);
  }
}

// Run all tests
async function runTests() {
  console.log('Starting API tests...\n');
  
  // Test chat and get the ID
  const chatId = await testChat();
  
  // Test logs
  await testLogs();
  
  // Test rate if we have a chat ID
  if (chatId) {
    await testRate(chatId);
    
    // Test logs again to see the updated rating
    await testLogs();
  }
  
  // Test TTS
  await testTTS();
  
  console.log('All tests completed!');
}

// Run the tests
runTests(); 