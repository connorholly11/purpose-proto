/**
 * Simple logger utility for the application
 */

const logger = {
  /**
   * Log info level message
   * @param {string} message - The message to log
   * @param {object} data - Optional data to include
   */
  info: (message, data = {}) => {
    console.log(`[INFO] ${message}`, data);
  },

  /**
   * Log error level message
   * @param {string} message - The message to log
   * @param {object|Error} error - The error to log
   */
  error: (message, error = {}) => {
    console.error(`[ERROR] ${message}`, error);
  },

  /**
   * Log warning level message
   * @param {string} message - The message to log
   * @param {object} data - Optional data to include
   */
  warn: (message, data = {}) => {
    console.warn(`[WARN] ${message}`, data);
  },

  /**
   * Log debug level message (only in development)
   * @param {string} message - The message to log
   * @param {object} data - Optional data to include
   */
  debug: (message, data = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${message}`, data);
    }
  }
};

module.exports = logger;
