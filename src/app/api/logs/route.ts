import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import logger from '@/lib/utils/logger';
import { getPrismaClient } from '@/lib/services/prisma';

// Path to log file
const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  
  // Create an empty log file if it doesn't exist
  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, '');
  }
}

// GET: Return logs from the server
export async function GET(req: NextRequest) {
  logger.info('API', 'Getting server logs (and possibly message logs)');

  const prisma = getPrismaClient();

  // Check optional query params
  const userId = req.nextUrl.searchParams.get('userId') || null;
  const conversationId = req.nextUrl.searchParams.get('conversationId') || null;
  const dateFrom = req.nextUrl.searchParams.get('dateFrom') || null;
  const dateTo = req.nextUrl.searchParams.get('dateTo') || null;
  const searchTerm = req.nextUrl.searchParams.get('search') || null;
  const likedStr = req.nextUrl.searchParams.get('liked') || null; // e.g. 'true' / 'false'

  // If you want to unify "logs" to also return DB messages:
  // We'll gather messages as well
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let messages: any[] = [];
  try {
    // Build a where filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {};

    // Filter by conversation userId
    if (userId) {
      whereClause.conversation = { userId };
    }
    // Filter by conversationId
    if (conversationId) {
      whereClause.conversationId = conversationId;
    }
    // Optionally filter date range
    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) {
        whereClause.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        // end of day
        const dt = new Date(dateTo);
        dt.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = dt;
      }
    }
    // If searching content
    if (searchTerm) {
      whereClause.content = { contains: searchTerm, mode: 'insensitive' };
    }

    // If likedFilter is implemented, you'd join with messageFeedback table
    // or store "liked" in the message table. For now, skip or do custom logic.

    messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        conversation: {
          select: {
            userId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 200, // limit if you want
    });
  } catch (dbError) {
    logger.error('API', 'Error fetching messages from DB', {
      error: (dbError as Error).message,
    });
    messages = [];
  }

  // Now read the local log file
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return NextResponse.json({ logs: [], messages });
    }

    const logContent = fs.readFileSync(LOG_FILE, 'utf-8');
    const logs = logContent.split('\n').filter(Boolean);
    const recentLogs = logs.slice(-1000);

    return NextResponse.json({
      logs: recentLogs,
      messages,
    });
  } catch (error) {
    logger.error('API', 'Error getting server logs from file', {
      error: (error as Error).message,
    });
    return NextResponse.json(
      { error: 'Failed to retrieve server logs' },
      { status: 500 }
    );
  }
}

// DELETE: Clear the server logs
export async function DELETE(req: NextRequest) {
  logger.info('API', 'Clearing server logs');
  
  try {
    if (fs.existsSync(LOG_FILE)) {
      fs.writeFileSync(LOG_FILE, '');
      logger.info('API', 'Server logs cleared');
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('API', 'Error clearing server logs', { error: (error as Error).message });
    return NextResponse.json(
      { error: 'Failed to clear server logs' },
      { status: 500 }
    );
  }
}
