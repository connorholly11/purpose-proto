import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import logger from '@/lib/utils/logger';

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
  logger.info('API', 'Getting server logs');
  
  try {
    // Check if log file exists
    if (!fs.existsSync(LOG_FILE)) {
      return NextResponse.json({ logs: [] });
    }
    
    // Read log file
    const logContent = fs.readFileSync(LOG_FILE, 'utf-8');
    const logs = logContent.split('\n').filter(Boolean);
    
    // Get the most recent logs (last 1000 lines max)
    const recentLogs = logs.slice(-1000);
    
    return NextResponse.json({ logs: recentLogs });
  } catch (error) {
    logger.error('API', 'Error getting server logs', { error: (error as Error).message });
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
    // Check if log file exists
    if (fs.existsSync(LOG_FILE)) {
      // Write empty string to file (clearing it)
      fs.writeFileSync(LOG_FILE, '');
      
      // Log that we cleared the logs (this will be the first entry in the new log file)
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