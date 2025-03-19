const axios = require('axios');

const API_URL = 'http://localhost:3003';

// Test the rating endpoint with a specific log ID
async function testRating(id) {
  try {
    console.log(`Testing rate endpoint for ID: ${id}...`);
    const response = await axios.post(`${API_URL}/api/rate`, {
      id,
      rating: true
    });
    
    console.log('Rate Response:');
    console.log(response.data);
    console.log('-----------------------------------');
    return true;
  } catch (error) {
    console.error('Error testing rate endpoint:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Get the most recent log ID and test rating
async function getRecentLogAndRate() {
  try {
    console.log('Getting recent logs...');
    const response = await axios.get(`${API_URL}/api/logs`);
    
    if (response.data && response.data.length > 0) {
      const recentLog = response.data[0];
      console.log(`Found recent log with ID: ${recentLog.id}`);
      
      // Test rating with this ID
      return await testRating(recentLog.id);
    } else {
      console.error('No logs found');
      return false;
    }
  } catch (error) {
    console.error('Error getting logs:', error.message);
    return false;
  }
}

// Run the test
async function runTest() {
  console.log('Starting rating endpoint test...\n');
  const success = await getRecentLogAndRate();
  
  if (success) {
    console.log('\nRating endpoint test PASSED!');
  } else {
    console.log('\nRating endpoint test FAILED!');
  }
}

// Run the test
runTest();
