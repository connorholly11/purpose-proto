#!/bin/bash

# Script to create a test user and run all RAG debugging tests in one command

# Create logs directory if it doesn't exist
mkdir -p logs

# Generate timestamp for the log file
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LOG_FILE="logs/rag-test-${TIMESTAMP}.log"

# Function to log messages to both console and log file
log() {
  echo "$@" | tee -a "$LOG_FILE"
}

# Start logging everything to the log file (including errors)
exec > >(tee -a "$LOG_FILE") 2>&1

log "🧪 Starting Complete RAG Test Suite"
log "===================================="
log "📄 Saving all output to: $LOG_FILE"

# Check if required packages are installed
log "🔄 Checking for required packages..."
if ! npm list module-alias --depth=0 --silent > /dev/null; then
  log "🔄 Installing module-alias package..."
  npm install module-alias --save-dev
else
  log "✅ module-alias package is already installed"
fi

if ! npm list node-fetch --depth=0 --silent > /dev/null; then
  log "🔄 Installing node-fetch package..."
  npm install node-fetch
else
  log "✅ node-fetch package is already installed"
fi

if ! npm list dotenv --depth=0 --silent > /dev/null; then
  log "🔄 Installing dotenv package..."
  npm install dotenv
else
  log "✅ dotenv package is already installed"
fi

# Check if development server is running
log "🔄 Checking if Next.js development server is running..."
if ! curl -s http://localhost:3000 > /dev/null; then
  log "⚠️  Warning: Development server doesn't seem to be running at http://localhost:3000"
  log "⚠️  The API tests will likely fail unless you start the server."
  log "⚠️  Open another terminal and run: npm run dev"
  
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "🛑 Test suite aborted. Start the development server and try again."
    exit 1
  fi
else
  log "✅ Development server is running"
fi

# Step 1: Create a test user
log ""
log "🧪 Step 1: Creating a test user"
log "--------------------------------"

# Get the optional name from command line args
USER_NAME=""
if [ "$1" != "" ]; then
  USER_NAME=$1
fi

# Run the create test user script and capture the output
log "🔄 Running user creation script..."
if [ "$USER_NAME" != "" ]; then
  USER_CREATION_OUTPUT=$(npx ts-node --project scripts/tsconfig.json scripts/create-test-user.ts "$USER_NAME")
else
  USER_CREATION_OUTPUT=$(npx ts-node --project scripts/tsconfig.json scripts/create-test-user.ts)
fi

# Print the full output
log "$USER_CREATION_OUTPUT"

# Extract the User ID from the output using regex
if [[ $USER_CREATION_OUTPUT =~ User\ ID:\ ([a-zA-Z0-9-]+) ]]; then
    TEST_USER_ID="${BASH_REMATCH[1]}"
    log "✅ Created user with ID: $TEST_USER_ID"
else
    log "❌ Failed to extract user ID from output"
    log "Output was: $USER_CREATION_OUTPUT"
    exit 1
fi

# Step 2: Run the tests with the new user ID
log ""
log "🧪 Step 2: Running tests with the new user ID"
log "--------------------------------"
log "🔄 Setting user ID to: $TEST_USER_ID"

# Update the test files with the new user ID
sed -i.bak "s/const TEST_USER_ID = 'your-actual-user-id';/const TEST_USER_ID = '$TEST_USER_ID';/g" scripts/debug-pinecone.ts
sed -i.bak "s/const TEST_USER_ID = 'your-actual-user-id';/const TEST_USER_ID = '$TEST_USER_ID';/g" scripts/test-rag.ts
sed -i.bak "s/const TEST_USER_ID = 'your-actual-user-id';/const TEST_USER_ID = '$TEST_USER_ID';/g" scripts/test-rag-api.ts

# Clean up backup files
rm scripts/*.bak 2>/dev/null || true

log ""
log "🧪 Test 1: Debug Pinecone connection"
log "--------------------------------"
npx ts-node --project scripts/tsconfig.json scripts/debug-pinecone.ts

log ""
log "🧪 Test 2: Test RAG system"
log "--------------------------------"
npx ts-node --project scripts/tsconfig.json scripts/test-rag.ts

log ""
log "🧪 Test 3: Test RAG API endpoints"
log "--------------------------------"
npx ts-node --project scripts/tsconfig.json scripts/test-rag-api.ts

log ""
log "===================================="
log "✅ All tests completed"
log ""
log "✨ Test user ID for future reference: $TEST_USER_ID"
log "To use this ID again later: ./scripts/run-all-tests.sh $TEST_USER_ID"
log ""
log "📋 Log file saved to: $LOG_FILE" 