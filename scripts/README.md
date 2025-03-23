# RAG Debugging Tools

This directory contains scripts to help debug and test the RAG (Retrieval-Augmented Generation) system outside of the chat interface.

## Quick Start

### One-Command Testing with Logging

The fastest way to test your RAG system is to use the all-in-one script:

```bash
# Creates a user named "Connor" and runs all tests, saving output to a log file
./scripts/rag-test-all.sh "Connor"
```

This script:
1. Creates a test user with the specified name
2. Automatically saves all output to a timestamped log file in the `logs/` directory
3. Runs all the tests with the new user ID
4. Shows a summary of results

### Analyzing Log Files

After running the tests, you can analyze the log files to identify common issues:

```bash
# Analyzes the most recent log file
./scripts/analyze-log.sh 
```

Or specify a specific log file:

```bash
./scripts/analyze-log.sh logs/rag-test-2023-05-20_14-35-42.log
```

The analyzer will identify common issues like:
- Database connection problems
- Pinecone configuration issues
- OpenAI API errors
- Embedding generation failures
- Low similarity scores
- API endpoint errors

## Alternative: Step-by-Step Testing

If you prefer to run tests individually:

### Step 1: Create a Test User

Before running any of the RAG tests, create a test user in the database:

```bash
# Creates a user named "Connor" and returns the user ID
npx ts-node --project scripts/tsconfig.json scripts/create-test-user.ts 

# Or specify a custom name
npx ts-node --project scripts/tsconfig.json scripts/create-test-user.ts "Your Name"
```

### Step 2: Run Tests with Valid User ID

Once you have a valid user ID, use it with the test scripts:

```bash
# Replace "your-user-id" with the actual ID returned from create-test-user.ts
./scripts/run-all-tests.sh your-user-id
```

## Available Scripts

### 1. `rag-test-all.sh`

All-in-one script that creates a user, runs all tests, and saves output to a log file.

```bash
./scripts/rag-test-all.sh "Connor"
```

### 2. `analyze-log.sh`

Analyzes log files to identify common RAG issues.

```bash
./scripts/analyze-log.sh logs/rag-test-2023-05-20_14-35-42.log
```

### 3. `create-test-user.ts`

Creates a user in the database that can be used for testing.

```bash
npx ts-node --project scripts/tsconfig.json scripts/create-test-user.ts
```

### 4. `test-rag.ts`

Tests the RAG system by adding a knowledge item, upserting it to Pinecone, and testing retrieval with various queries.

```bash
npx ts-node --project scripts/tsconfig.json scripts/test-rag.ts
```

### 5. `debug-pinecone.ts`

Directly tests the Pinecone connection, validates environment variables, and queries the vector database.

```bash
npx ts-node --project scripts/tsconfig.json scripts/debug-pinecone.ts
```

### 6. `test-rag-api.ts`

Tests the RAG API endpoints by adding knowledge items via the API and testing retrieval.

```bash
npx ts-node --project scripts/tsconfig.json scripts/test-rag-api.ts
```

## Setup Before Running

1. Make sure your local development server is running (for `test-rag-api.ts`)
   ```bash
   npm run dev
   ```

2. Ensure your `.env` file has all the necessary credentials:
   - `PINECONE_API_KEY` - For vector database access
   - `PINECONE_HOST` - For vector database access
   - `PINECONE_INDEX` - For vector database access
   - `OPENAI_API_KEY` - For embedding generation
   - `DATABASE_URL` - For database access

3. Install dependencies (installed automatically by the scripts):
   ```bash
   npm install node-fetch dotenv module-alias --save-dev
   ```

## Common Issues and Solutions

### Foreign Key Constraint Error

If you see a "Foreign key constraint violated" error, it means the user ID doesn't exist in your database. Use the `create-test-user.ts` script to create a valid user first.

### HTML Response Instead of JSON

If your API is returning HTML instead of JSON, make sure:
1. The development server is running
2. You're using the correct API endpoint paths
3. You're using a valid user ID from your database

### Chat Interface Not Using RAG Results

If all tests pass but the chat interface doesn't show RAG results, check:
1. The chat completion logic to ensure it's using the RAG context
2. The user ID being passed in the chat context matches the one you tested with
3. The similarity threshold in your RAG service (if it's too high, results may be filtered)

### Low Similarity Scores

If you're getting low similarity scores (<0.7):
1. Check if the embeddings are using the right model
2. Ensure your test queries are semantically similar to the content
3. Try adding more content or more specific content to improve matches

## Understanding the Log Files

The log files in the `logs/` directory contain the complete output of the tests. They follow this naming convention:

```
logs/rag-test-YYYY-MM-DD_HH-MM-SS.log
```

Each log file includes:
- User creation details
- Pinecone connection status
- Embedding generation details
- Vector search results and similarity scores
- API responses and errors

Use the `analyze-log.sh` script to get a quick summary of key issues. 