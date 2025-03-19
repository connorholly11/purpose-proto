// Browser-side logger for client components
// Since we can't write to the filesystem from the browser, this logger
// will output to the console and also store logs in localStorage for debugging

// Configure how many logs to keep in localStorage
const MAX_LOGS = 1000;
const STORAGE_KEY = 'app_client_logs';

// Logger levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Format the current time for logging
const getTimestamp = () => {
  return new Date().toISOString();
};

// Store log in localStorage
const storeLog = (logEntry: string) => {
  try {
    // Get existing logs
    const existingLogsString = localStorage.getItem(STORAGE_KEY) || '[]';
    const existingLogs = JSON.parse(existingLogsString);
    
    // Add new log and limit size
    existingLogs.push(logEntry);
    if (existingLogs.length > MAX_LOGS) {
      existingLogs.shift(); // Remove oldest log
    }
    
    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingLogs));
  } catch (err) {
    console.error('Failed to store log in localStorage:', err);
  }
};

// Main logging function
const log = (level: LogLevel, category: string, message: string, data?: any) => {
  const timestamp = getTimestamp();
  const dataStr = data ? JSON.stringify(data) : '';
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
  
  // Store in localStorage
  storeLog(logEntry);
  
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

// Utility function to download logs as a text file
export const downloadLogs = () => {
  try {
    const logsString = localStorage.getItem(STORAGE_KEY) || '[]';
    const logs = JSON.parse(logsString);
    
    const blob = new Blob([logs.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `client-logs-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (err) {
    console.error('Failed to download logs:', err);
    return false;
  }
};

// Utility function to clear logs
export const clearLogs = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (err) {
    console.error('Failed to clear logs:', err);
    return false;
  }
};

// Export the default logger object
const browserLogger = {
  debug,
  info,
  warn,
  error,
  downloadLogs,
  clearLogs
};

export default browserLogger; 