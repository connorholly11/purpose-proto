import fs from 'fs';
import path from 'path';

// Ensure logs directory exists
const LOG_DIR = path.join(process.cwd(), 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const LOG_FILE = path.join(LOG_DIR, 'app.log');

// Logger levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Format the current time for logging
const getTimestamp = () => {
  return new Date().toISOString();
};

// Write to log file (server-side only)
const writeToFile = (message: string) => {
  try {
    // Only run on server
    if (typeof window === 'undefined') {
      fs.appendFileSync(LOG_FILE, message + '\n');
    }
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
};

// Main logging function
const log = (level: LogLevel, category: string, message: string, data?: any) => {
  const timestamp = getTimestamp();
  const dataStr = data ? JSON.stringify(data, null, 2) : '';
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] [${category}] ${message} ${dataStr}`;
  
  // Console output (color-coded)
  switch (level) {
    case 'debug':
      console.debug(logEntry);
      break;
    case 'info':
      console.info(logEntry);
      break;
    case 'warn':
      console.warn(logEntry);
      break;
    case 'error':
      console.error(logEntry);
      break;
  }
  
  // File output (server-side only)
  writeToFile(logEntry);
  
  // Return the log entry for potential chaining
  return logEntry;
};

// Helper functions for specific log levels
export const debug = (category: string, message: string, data?: any) => 
  log('debug', category, message, data);

export const info = (category: string, message: string, data?: any) => 
  log('info', category, message, data);

export const warn = (category: string, message: string, data?: any) => 
  log('warn', category, message, data);

export const error = (category: string, message: string, data?: any) => 
  log('error', category, message, data);

// Export the default logger object
const logger = {
  debug,
  info,
  warn,
  error
};

export default logger; 