#!/usr/bin/env node

/**
 * This script verifies that all required environment variables are set
 * It should be run as part of the deployment process
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'OPENAI_API_KEY',
  'EMBEDDING_MODEL',
  'PINECONE_API_KEY',
  'PINECONE_HOST',
  'PINECONE_INDEX',
];

// For admin routes
const optionalEnvVars = [
  'ADMIN_SECRET_KEY',
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
const missingOptionalVars = optionalEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ ERROR: Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('These variables must be set for the application to function correctly.');
  process.exit(1);
}

if (missingOptionalVars.length > 0) {
  console.warn('⚠️ WARNING: Missing optional environment variables:');
  missingOptionalVars.forEach(varName => console.warn(`   - ${varName}`));
  console.warn('These variables are not required but may limit functionality.');
}

// Verify database connection string format
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl.startsWith('postgresql://')) {
  console.error('❌ ERROR: DATABASE_URL does not appear to be a valid PostgreSQL connection string');
  process.exit(1);
}

console.log('✅ All required environment variables are present');
console.log('🔍 To fix database extensions and ensure schema is correct, run:');
console.log('   curl -X POST https://your-app-url/api/admin/db-fix -H "x-admin-key: YOUR_ADMIN_SECRET_KEY"'); 