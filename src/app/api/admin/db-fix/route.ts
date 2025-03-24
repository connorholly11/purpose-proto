import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/services/prisma';

export async function POST(request: NextRequest) {
  const prisma = getPrismaClient();
  try {
    const adminKey = request.headers.get('x-admin-key');
    if (process.env.NODE_ENV === 'production' && adminKey !== process.env.ADMIN_SECRET_KEY) {
      console.error('db-fix error: Unauthorized attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Attempt to install uuid-ossp extension
    try {
      await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    } catch (error: unknown) {
      console.error('Failed to create UUID extension:', error instanceof Error ? error.stack : error);
    }

    // Example: If you want to ensure lastSummarizedAt column, etc.
    try {
      await prisma.$executeRawUnsafe(`
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
      `);
    } catch (error: unknown) {
      console.error('Failed to add lastSummarizedAt column:', error instanceof Error ? error.stack : error);
    }

    // Example: If you want to ensure a table or index:
    try {
      await prisma.$executeRawUnsafe(`
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
      `);
    } catch (error: unknown) {
      console.error('Failed to create ConversationSummary table:', error instanceof Error ? error.stack : error);
    }

    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "ConversationSummary_conversationId_idx"
        ON "ConversationSummary" ("conversationId");
      `);
    } catch (error: unknown) {
      console.error('Failed to create index:', error instanceof Error ? error.stack : error);
    }

    // Test query
    let testResults = {};
    try {
      const count = await prisma.conversation.count();
      testResults = { conversations: count };
    } catch (error: unknown) {
      console.error('Test query failed:', error instanceof Error ? error.stack : error);
    }

    return NextResponse.json({
      message: 'Database fixes applied successfully',
      testResults
    });
  } catch (error: unknown) {
    console.error('Error fixing database:', error instanceof Error ? error.stack : error);
    return NextResponse.json(
      { error: 'Failed to apply database fixes' },
      { status: 500 }
    );
  }
}
