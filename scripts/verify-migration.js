/**
 * Migration Verification Script
 * 
 * This script performs automated tests to verify that API endpoints
 * in the Next.js app are working correctly.
 */

const axios = require('axios');
require('dotenv').config({ path: './.env.local' });

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN;

if (!AUTH_TOKEN) {
  console.error('Error: TEST_AUTH_TOKEN is required in .env.local');
  process.exit(1);
}

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`
  }
});

// Test definitions
const tests = [
  {
    name: 'Health Check',
    endpoint: '/health',
    method: 'get',
    expectStatus: 200
  },
  {
    name: 'Get Legal Terms',
    endpoint: '/legal/terms',
    method: 'get',
    expectStatus: 200
  },
  {
    name: 'Get Legal Acceptance Status',
    endpoint: '/legal/acceptance',
    method: 'get',
    expectStatus: 200
  },
  {
    name: 'Admin: Get System Prompts',
    endpoint: '/admin/system-prompts',
    method: 'get',
    expectStatus: 200
  },
  {
    name: 'Admin: Get Active System Prompt',
    endpoint: '/admin/system-prompts/active',
    method: 'get',
    expectStatus: 200
  },
  {
    name: 'Eval: Get Personas',
    endpoint: '/eval/personas',
    method: 'get',
    expectStatus: 200
  }
];

// Run the tests
async function runTests() {
  console.log('Starting API verification tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name} (${test.method.toUpperCase()} ${test.endpoint})`);
      
      const response = await api[test.method](test.endpoint);
      
      if (response.status === test.expectStatus) {
        console.log(`✅ Passed (${response.status})`);
        passed++;
      } else {
        console.log(`❌ Failed - Expected status ${test.expectStatus}, got ${response.status}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ Failed - ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      failed++;
    }
    console.log(''); // Empty line for readability
  }
  
  // Print summary
  console.log('Test Summary:');
  console.log(`Total: ${tests.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n⚠️ Some tests failed. Please review the output above.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
  }
}

// Execute the tests
runTests().catch(err => {
  console.error('An error occurred during testing:', err);
  process.exit(1);
});