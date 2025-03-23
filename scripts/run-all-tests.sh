#!/bin/bash

# Script to run all RAG debugging tests

echo "🧪 Starting RAG debugging test suite"
echo "===================================="

# Check if required packages are installed
echo "🔄 Checking for required packages..."
if ! npm list module-alias --depth=0 --silent > /dev/null; then
  echo "🔄 Installing module-alias package..."
  npm install module-alias --save-dev
else
  echo "✅ module-alias package is already installed"
fi

if ! npm list node-fetch --depth=0 --silent > /dev/null; then
  echo "🔄 Installing node-fetch package..."
  npm install node-fetch
else
  echo "✅ node-fetch package is already installed"
fi

if ! npm list dotenv --depth=0 --silent > /dev/null; then
  echo "🔄 Installing dotenv package..."
  npm install dotenv
else
  echo "✅ dotenv package is already installed"
fi

# Check if development server is running
echo "🔄 Checking if Next.js development server is running..."
if ! curl -s http://localhost:3000 > /dev/null; then
  echo "⚠️  Warning: Development server doesn't seem to be running at http://localhost:3000"
  echo "⚠️  The API tests will likely fail unless you start the server."
  echo "⚠️  Open another terminal and run: npm run dev"
  
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "🛑 Test suite aborted. Start the development server and try again."
    exit 1
  fi
else
  echo "✅ Development server is running"
fi

# Check if user ID is provided
if [ "$1" != "" ]; then
  # Replace the default TEST_USER_ID in each file
  echo "🔄 Setting user ID to: $1"
  sed -i.bak "s/const TEST_USER_ID = 'your-actual-user-id';/const TEST_USER_ID = '$1';/g" scripts/debug-pinecone.ts
  sed -i.bak "s/const TEST_USER_ID = 'your-actual-user-id';/const TEST_USER_ID = '$1';/g" scripts/test-rag.ts
  sed -i.bak "s/const TEST_USER_ID = 'your-actual-user-id';/const TEST_USER_ID = '$1';/g" scripts/test-rag-api.ts
  
  # Clean up backup files
  rm scripts/*.bak 2>/dev/null || true
else
  echo "⚠️  No user ID provided. Using default placeholder values."
  echo "   Consider using: ./scripts/run-all-tests.sh YOUR_USER_ID"
fi

echo ""
echo "🧪 Test 1: Debug Pinecone connection"
echo "--------------------------------"
npx ts-node --project scripts/tsconfig.json scripts/debug-pinecone.ts

echo ""
echo "🧪 Test 2: Test RAG system"
echo "--------------------------------"
npx ts-node --project scripts/tsconfig.json scripts/test-rag.ts

echo ""
echo "🧪 Test 3: Test RAG API endpoints"
echo "--------------------------------"
npx ts-node --project scripts/tsconfig.json scripts/test-rag-api.ts

echo ""
echo "===================================="
echo "✅ All tests completed" 