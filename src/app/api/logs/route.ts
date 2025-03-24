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
  logger.info('API', 'Getting logs', { 
    path: req.nextUrl.pathname,
    queryParams: Object.fromEntries(req.nextUrl.searchParams.entries()),
  });

  const prisma = getPrismaClient();

  // Check optional query params
  const userId = req.nextUrl.searchParams.get('userId') || null;
  const conversationId = req.nextUrl.searchParams.get('conversationId') || null;
  const dateFrom = req.nextUrl.searchParams.get('dateFrom') || null;
  const dateTo = req.nextUrl.searchParams.get('dateTo') || null;
  const searchTerm = req.nextUrl.searchParams.get('search') || null;
  const likedStr = req.nextUrl.searchParams.get('liked') || null; // e.g. 'true' / 'false'
  const levelFilter = req.nextUrl.searchParams.get('level') || null;
  const serviceFilter = req.nextUrl.searchParams.get('service') || null;
  const isAdmin = req.nextUrl.pathname.includes('/admin');

  // Get messages if requested
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

    // Only fetch messages if not specifically filtered for logs only
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
    
    // Parse logs based on format and apply filters
    const logLines = logContent.split('\n').filter(Boolean);
    
    // Format and filter logs
    let logs = logLines;
    
    // Apply filters for admin view
    if (searchTerm) {
      logs = logs.filter(log => log.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    if (levelFilter && levelFilter !== 'all') {
      logs = logs.filter(log => {
        const levelMatch = log.match(/\[(INFO|ERROR|WARN|DEBUG)\]/i);
        if (levelMatch) {
          return levelMatch[1].toLowerCase() === levelFilter.toLowerCase();
        }
        return false;
      });
    }
    
    if (serviceFilter && serviceFilter !== 'all') {
      logs = logs.filter(log => {
        const serviceMatch = log.match(/\[([^\]]+)\]/g);
        if (serviceMatch && serviceMatch.length >= 2) {
          // The service name is typically the second bracketed term
          return serviceMatch[1].toLowerCase().includes(serviceFilter.toLowerCase());
        }
        return false;
      });
    }
    
    // For admin view, parse logs into structured format
    if (isAdmin) {
      // Transform logs into structured format for admin view
      const parsedLogs = logs.slice(-1000).map(log => {
        // Extract timestamp, level, service, message, and details
        const timestampMatch = log.match(/^\[(.*?)\]/);
        const levelMatch = log.match(/\[(INFO|ERROR|WARN|DEBUG)\]/i);
        const serviceMatch = log.match(/\[([^\]]+)\]/g);
        
        let timestamp = '';
        let level = 'info';
        let service = '';
        let message = log;
        let details = {};
        
        if (timestampMatch) timestamp = timestampMatch[1];
        
        if (levelMatch) {
          level = levelMatch[1].toLowerCase();
          message = message.replace(levelMatch[0], '');
        }
        
        if (serviceMatch && serviceMatch.length >= 2) {
          service = serviceMatch[1].replace('[', '').replace(']', '');
          message = message.replace(serviceMatch[0], '').replace(serviceMatch[1], '');
        }
        
        // Extract JSON details if available
        const detailsMatch = message.match(/{.*}/);
        if (detailsMatch) {
          try {
            details = JSON.parse(detailsMatch[0]);
            message = message.replace(detailsMatch[0], '');
          } catch {
            // Ignore parsing errors
          }
        }
        
        message = message.trim();
        
        return {
          timestamp,
          level,
          service,
          message,
          details
        };
      });
      
      return NextResponse.json({ logs: parsedLogs, messages });
    }
    
    // For developer view, just return the raw logs
    return NextResponse.json({
      logs: logs.slice(-1000),
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
