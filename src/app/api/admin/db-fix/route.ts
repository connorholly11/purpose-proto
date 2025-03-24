import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/services/prisma';
import logger from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  const prisma = getPrismaClient();
  try {
    // Validate admin credentials
    const adminKey = request.headers.get('x-admin-key');
    if (process.env.NODE_ENV === 'production' && adminKey !== process.env.ADMIN_SECRET_KEY) {
      logger.error('db-fix', 'Unauthorized attempt', { ip: request.headers.get('x-forwarded-for') || 'unknown' });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Start database fix process
    logger.info('db-fix', 'Starting database fix process');
    const results = {
      extension: false,
      tables: {} as Record<string, boolean>,
      indices: {} as Record<string, boolean>,
      constraints: {} as Record<string, boolean>,
      testQueries: {} as Record<string, any>
    };

    // Step 1: Check database connectivity
    try {
      await prisma.$executeRaw`SELECT 1`;
      logger.info('db-fix', 'Database connection successful');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('db-fix', 'Database connection failed', { error: errorMsg });
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: errorMsg 
      }, { status: 500 });
    }

    // Step 2: Create UUID extension (critical for our schema)
    try {
      await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      // Verify it works
      const uuidTest = await prisma.$queryRaw<{uuid: string}[]>`SELECT uuid_generate_v4() as uuid`;
      results.extension = !!uuidTest[0]?.uuid;
      logger.info('db-fix', 'UUID extension created successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('db-fix', 'Failed to create UUID extension', { error: errorMsg });
      results.extension = false;
    }

    // Step 3: Check and fix critical tables
    const criticalTables = [
      'User', 'Conversation', 'Message', 'SystemPrompt', 'ConversationSummary'
    ];
    
    for (const table of criticalTables) {
      try {
        // Check if table exists
        const tableCheck = await prisma.$queryRaw<{exists: boolean}[]>`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = ${table}
          ) as exists
        `;
        
        results.tables[table] = tableCheck[0]?.exists || false;
        logger.info('db-fix', `Table check: ${table}`, { exists: results.tables[table] });
        
        // For ConversationSummary, we might need to create it if missing
        if (table === 'ConversationSummary' && !results.tables[table]) {
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
            
            await prisma.$executeRawUnsafe(`
              CREATE INDEX IF NOT EXISTS "ConversationSummary_conversationId_idx"
              ON "ConversationSummary" ("conversationId");
            `);
            
            logger.info('db-fix', 'Created ConversationSummary table and index');
            results.tables['ConversationSummary'] = true;
          } catch (tableError) {
            logger.error('db-fix', 'Failed to create ConversationSummary table', { 
              error: tableError instanceof Error ? tableError.message : String(tableError) 
            });
          }
        }
      } catch (error) {
        logger.error('db-fix', `Failed to check table: ${table}`, { 
          error: error instanceof Error ? error.message : String(error) 
        });
        results.tables[table] = false;
      }
    }

    // Step 4: Check for lastSummarizedAt column in Conversation
    try {
      const columnCheck = await prisma.$queryRaw<{exists: boolean}[]>`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'Conversation' AND column_name = 'lastSummarizedAt'
        ) as exists
      `;
      
      if (!columnCheck[0]?.exists) {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "lastSummarizedAt" TIMESTAMP;
        `);
        logger.info('db-fix', 'Added lastSummarizedAt column to Conversation table');
      }
    } catch (error) {
      logger.error('db-fix', 'Failed to check/add lastSummarizedAt column', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }

    // Step 5: Run test queries to verify functionality
    try {
      // Test User count
      const userCount = await prisma.user.count();
      results.testQueries['userCount'] = userCount;
      
      // Test SystemPrompt
      const promptCount = await prisma.$queryRaw<{count: string}[]>`
        SELECT COUNT(*) as count FROM "SystemPrompt"
      `;
      results.testQueries['promptCount'] = parseInt(promptCount[0]?.count || '0');
      
      // Test ConversationSummary if it exists
      if (results.tables['ConversationSummary']) {
        const summaryCount = await prisma.$queryRaw<{count: string}[]>`
          SELECT COUNT(*) as count FROM "ConversationSummary"
        `;
        results.testQueries['summaryCount'] = parseInt(summaryCount[0]?.count || '0');
      }
      
      logger.info('db-fix', 'Test queries completed successfully', { results: results.testQueries });
    } catch (error) {
      logger.error('db-fix', 'Test queries failed', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }

    return NextResponse.json({
      message: 'Database fix process completed',
      results,
      recommendations: !results.extension 
        ? ['Have a database admin manually run: CREATE EXTENSION "uuid-ossp";'] 
        : []
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error('db-fix', 'Database fix process failed', { error: errorMsg });
    return NextResponse.json(
      { error: 'Failed to apply database fixes', details: errorMsg },
      { status: 500 }
    );
  }
}
