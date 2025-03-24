import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/services/prisma';

// Admin-only endpoint to fix database issues
export async function POST(request: NextRequest) {
  try {
    // Ensure this endpoint can only be accessed by authorized users in production
    const adminKey = request.headers.get('x-admin-key');
    if (process.env.NODE_ENV === 'production' && adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fix 1: Ensure the UUID extension is installed
    try {
      await getPrismaClient().$executeRaw`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    } catch (error) {
      console.error('Failed to create UUID extension:', error);
    }

    // Fix 2: Add lastSummarizedAt column to Conversation table if it doesn't exist
    try {
      await getPrismaClient().$executeRaw`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'Conversation' AND column_name = 'lastSummarizedAt'
          ) THEN
            ALTER TABLE "Conversation" ADD COLUMN "lastSummarizedAt" TIMESTAMP;
          END IF;
        END
        $$;
      `;
    } catch (error) {
      console.error('Failed to add lastSummarizedAt column:', error);
    }

    // Fix 3: Create ConversationSummary table if it doesn't exist
    try {
      await getPrismaClient().$executeRaw`
        CREATE TABLE IF NOT EXISTS "ConversationSummary" (
          "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          "conversationId" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "startMessageId" TEXT,
          "endMessageId" TEXT,
          "embeddings" JSONB,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "priority" INTEGER NOT NULL DEFAULT 1,
          "lastAccessed" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "ConversationSummary_conversationId_fkey" 
            FOREIGN KEY ("conversationId") 
            REFERENCES "Conversation"("id") ON DELETE CASCADE
        );
      `;
    } catch (error) {
      console.error('Failed to create ConversationSummary table:', error);
    }

    // Fix 4: Create an index on conversationId for faster retrieval
    try {
      await getPrismaClient().$executeRaw`
        CREATE INDEX IF NOT EXISTS "ConversationSummary_conversationId_idx" 
        ON "ConversationSummary" ("conversationId");
      `;
    } catch (error) {
      console.error('Failed to create index:', error);
    }

    // Run a simple test query to verify the setup
    let testResults = { };
    try {
      const convoCount = await getPrismaClient().conversation.count();
      testResults = { conversations: convoCount };
    } catch (error) {
      console.error('Test query failed:', error);
    }

    return NextResponse.json({
      message: 'Database fixes applied successfully',
      testResults
    });
  } catch (error) {
    console.error('Error fixing database:', error);
    return NextResponse.json(
      { error: 'Failed to apply database fixes' },
      { status: 500 }
    );
  }
} 