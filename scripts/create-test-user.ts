// Required to resolve @/ imports
require('./aliases');

import { getPrismaClient } from '@/lib/services/prisma';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Function to create a test user
async function createTestUser(name: string = 'Test User'): Promise<{ id: string; name: string | null }> {
  const prisma = getPrismaClient();
  
  try {
    console.log(`🔄 Creating test user with name: "${name}"...`);
    
    const user = await prisma.user.create({
      data: {
        name
      }
    });
    
    console.log(`✅ User created successfully!`);
    console.log(`✅ User ID: ${user.id}`);
    console.log(`✅ User Name: ${user.name || 'No name specified'}`);
    
    return user;
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Main function
async function main() {
  try {
    const userName = process.argv[2] || 'Connor';
    const user = await createTestUser(userName);
    
    console.log('\n------------------------------------------------');
    console.log('📋 Use this ID for your RAG testing:');
    console.log(`./scripts/run-all-tests.sh ${user.id}`);
    console.log('------------------------------------------------');
  } catch (error) {
    console.error('❌ Failed to create test user:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error); 