#!/bin/bash

# Script to analyze RAG test logs and identify common issues

if [ -z "$1" ]; then
  echo "Please provide a log file to analyze."
  echo "Usage: ./scripts/analyze-log.sh logs/rag-test-YYYY-MM-DD_HH-MM-SS.log"
  
  # If no log file is provided, suggest the most recent one
  LATEST_LOG=$(ls -t logs/rag-test-*.log 2>/dev/null | head -n 1)
  if [ -n "$LATEST_LOG" ]; then
    echo ""
    echo "Most recent log file: $LATEST_LOG"
    echo "To analyze it: ./scripts/analyze-log.sh $LATEST_LOG"
  fi
  exit 1
fi

LOG_FILE=$1

if [ ! -f "$LOG_FILE" ]; then
  echo "Log file not found: $LOG_FILE"
  exit 1
fi

echo "🔍 Analyzing log file: $LOG_FILE"
echo "=================================================="

# Extract the user ID
USER_ID=$(grep -o "Created user with ID: [a-zA-Z0-9-]*" "$LOG_FILE" | head -n 1 | cut -d' ' -f5)
if [ -n "$USER_ID" ]; then
  echo "✅ User ID: $USER_ID"
else
  echo "❌ No user ID found in log file"
fi

# Check for database connection issues
if grep -q "PrismaClientInitializationError\|ConnectionError\|connection.*failed" "$LOG_FILE"; then
  echo "❌ DATABASE ISSUE: Connection problems detected"
  grep -n "PrismaClientInitializationError\|ConnectionError\|connection.*failed" "$LOG_FILE" | head -n 3
else
  echo "✅ Database connection appears to be working"
fi

# Check for Pinecone issues
if grep -q "PINECONE_API_KEY\|PINECONE_HOST\|PINECONE_INDEX.*not defined" "$LOG_FILE"; then
  echo "❌ PINECONE ISSUE: Missing environment variables"
  grep -n "PINECONE_API_KEY\|PINECONE_HOST\|PINECONE_INDEX.*not defined" "$LOG_FILE" | head -n 3
else
  echo "✅ Pinecone environment variables are set"
fi

# Check for OpenAI issues
if grep -q "OpenAI\|OPENAI_API_KEY\|Rate limit\|token" "$LOG_FILE"; then
  echo "❌ OPENAI ISSUE: OpenAI API errors detected"
  grep -n "OpenAI\|OPENAI_API_KEY\|Rate limit\|token" "$LOG_FILE" | head -n 3
else
  echo "✅ No obvious OpenAI API issues detected"
fi

# Check for embedding generation
if grep -q "Generated embedding of length" "$LOG_FILE"; then
  EMBEDDING_LENGTH=$(grep "Generated embedding of length" "$LOG_FILE" | head -n 1 | grep -o "[0-9]\+")
  echo "✅ Embeddings were generated (length: $EMBEDDING_LENGTH)"
else
  echo "❌ EMBEDDING ISSUE: No embeddings were generated"
fi

# Check for successful vector retrieval
if grep -q "Found.*matches" "$LOG_FILE"; then
  MATCHES=$(grep "Found.*matches" "$LOG_FILE" | head -n 1)
  echo "✅ Vector retrieval: $MATCHES"
else
  echo "❌ RETRIEVAL ISSUE: No matches found in vector database"
fi

# Check for API issues
if grep -q "RAG API request failed\|HTML instead of JSON\|SyntaxError: Unexpected token" "$LOG_FILE"; then
  echo "❌ API ISSUE: API endpoints not returning proper JSON"
  grep -n "RAG API request failed\|HTML instead of JSON\|SyntaxError: Unexpected token" "$LOG_FILE" | head -n 3
else
  echo "✅ API endpoints appear to be working"
fi

# Check for foreign key constraint errors
if grep -q "Foreign key constraint\|violat\|constraint.*foreign" "$LOG_FILE"; then
  echo "❌ DATABASE ISSUE: Foreign key constraint violations"
  grep -n "Foreign key constraint\|violat\|constraint.*foreign" "$LOG_FILE" | head -n 3
else
  echo "✅ No foreign key constraint errors detected"
fi

# Check for similarity scores
if grep -q "Score: [0-9]\.[0-9]\+" "$LOG_FILE"; then
  # Get the highest similarity score
  MAX_SCORE=$(grep -o "Score: [0-9]\.[0-9]\+" "$LOG_FILE" | cut -d' ' -f2 | sort -nr | head -n 1)
  if (( $(echo "$MAX_SCORE > 0.7" | bc -l) )); then
    echo "✅ Good similarity scores found (max: $MAX_SCORE)"
  else
    echo "⚠️  LOW SIMILARITY: Highest similarity score is only $MAX_SCORE (should be > 0.7)"
  fi
else
  echo "❌ RETRIEVAL ISSUE: No similarity scores found"
fi

# Check if any test succeeded
SUCCESS_COUNT=$(grep -c "SUCCESS: Found name" "$LOG_FILE")
FAIL_COUNT=$(grep -c "FAIL: Did not find name" "$LOG_FILE")

echo ""
echo "=================================================="
echo "🏁 Summary:"
echo "- Success markers: $SUCCESS_COUNT"
echo "- Failure markers: $FAIL_COUNT"

if [ $SUCCESS_COUNT -gt 0 ]; then
  echo "✅ Some RAG retrievals were successful"
else
  echo "❌ NO SUCCESS: No successful retrievals detected"
fi

echo ""
echo "🔧 Suggested actions:"

if [ $SUCCESS_COUNT -eq 0 ]; then
  if grep -q "Missing.*environment" "$LOG_FILE"; then
    echo "1. Check your .env file for missing Pinecone or OpenAI credentials"
  fi
  
  if grep -q "Foreign key constraint\|violat\|constraint.*foreign" "$LOG_FILE"; then
    echo "2. Ensure you're using a valid user ID that exists in your database"
  fi
  
  if grep -q "RAG API request failed\|HTML instead of JSON\|SyntaxError: Unexpected token" "$LOG_FILE"; then
    echo "3. Make sure your Next.js development server is running"
  fi
  
  if grep -q "No matches found" "$LOG_FILE" && ! grep -q "Generated embedding" "$LOG_FILE"; then
    echo "4. Check your OpenAI API key - embeddings aren't being generated"
  fi
else
  echo "1. The tests show some success, but you may want to check the chat completion logic"
  echo "2. Verify that RAG results are properly integrated into your chat interface"
fi

echo ""
echo "To view the complete log file: less $LOG_FILE" 