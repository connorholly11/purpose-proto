/**
 * Service for OpenAI Realtime API interactions
 * This service handles the generation of ephemeral tokens for WebRTC connections to OpenAI's Realtime API
 */

const { v4: uuidv4 } = require('uuid');
// Use console directly instead of a separate logger module
const logger = {
  info: (message, data = {}) => console.log(`[INFO] ${message}`, data),
  error: (message, error = {}) => console.error(`[ERROR] ${message}`, error),
  warn: (message, data = {}) => console.warn(`[WARN] ${message}`, data),
  debug: (message, data = {}) => process.env.NODE_ENV !== 'production' && console.debug(`[DEBUG] ${message}`, data)
};
const openaiService = require('./index');
const ragService = require('../rag');

// Track active sessions
const activeSessions = new Map();

/**
 * Realtime API service for voice interactions using WebRTC
 */
const realtimeService = {
  /**
   * Create a new Realtime session with OpenAI
   * @param {object} options - Session options
   * @param {string} options.model - Realtime model ID to use
   * @param {string} options.voice - Voice to use for TTS
   * @returns {Promise<object>} - Session data including the ephemeral token
   */
  async createRealtimeSession(options = {}) {
    try {
      const model = options.model || 'gpt-4o-realtime-preview-2024-12-17';
      const voice = options.voice || 'verse';
      
      // Call OpenAI to generate an ephemeral token
      const sessionData = await openaiService.createRealtimeSession({
        model,
        voice
      });
      
      const sessionId = uuidv4();
      
      // Store session info
      activeSessions.set(sessionId, {
        id: sessionId,
        openaiSessionId: sessionData.id,
        ephemeralKey: sessionData.client_secret.value,
        model,
        voice,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000), // Ephemeral keys expire after 1 minute
        userId: options.userId || null,
        systemPrompt: options.systemPrompt || null,
        messages: []
      });
      
      logger.info(`Created new Realtime session: ${sessionId}`);
      
      // Schedule cleanup after token expiration
      setTimeout(() => {
        if (activeSessions.has(sessionId)) {
          const session = activeSessions.get(sessionId);
          if (!session.isActive) {
            activeSessions.delete(sessionId);
            logger.info(`Cleaned up expired Realtime session: ${sessionId}`);
          }
        }
      }, 65000); // 65 seconds to account for any potential delays
      
      return {
        sessionId,
        ...sessionData
      };
    } catch (error) {
      logger.error(`Error creating Realtime session: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Store transcription and response data for a session
   * @param {string} sessionId - Session ID
   * @param {object} data - Session data to store
   * @returns {boolean} - Success status
   */
  storeSessionData(sessionId, data) {
    const session = activeSessions.get(sessionId);
    if (!session) {
      logger.warn(`Attempt to store data for non-existent session: ${sessionId}`);
      return false;
    }
    
    try {
      // Add messages to session history
      if (data.userMessage) {
        session.messages.push({
          role: 'user',
          content: data.userMessage
        });
      }
      
      if (data.assistantMessage) {
        session.messages.push({
          role: 'assistant',
          content: data.assistantMessage
        });
      }
      
      // Update system prompt if provided
      if (data.systemPrompt) {
        session.systemPrompt = data.systemPrompt;
      }
      
      // Mark if RAG was used
      if (data.usedRag !== undefined) {
        session.usedRag = data.usedRag;
      }
      
      // Update session information
      session.lastActivity = new Date();
      
      return true;
    } catch (error) {
      logger.error(`Error storing session data: ${error.message}`);
      return false;
    }
  },
  
  /**
   * Process a text message with RAG and return contextual information
   * @param {string} sessionId - Session ID
   * @param {string} message - Text message
   * @returns {Promise<object>} - RAG results and system prompt
   */
  async processWithRag(sessionId, message) {
    const session = activeSessions.get(sessionId);
    if (!session) {
      logger.warn(`Attempt to process RAG for non-existent session: ${sessionId}`);
      return { 
        contextualInfo: '',
        systemPrompt: "You are a helpful AI assistant."
      };
    }
    
    try {
      // Get system prompt (default if not set)
      const baseSystemPrompt = session.systemPrompt || 
        "You are a helpful AI assistant. If provided with contextual information, use it to inform your responses.";
      
      // Try to get RAG context
      let contextualInfo = '';
      try {
        // Get relevant documents based on the query
        const relevantDocs = await ragService.retrieveRelevantDocuments(message);
        if (relevantDocs && relevantDocs.length > 0) {
          contextualInfo = relevantDocs.map(doc => doc.content).join('\n\n');
        }
      } catch (error) {
        logger.error(`Error in RAG processing: ${error.message}`);
      }
      
      // Create full system prompt with context if available
      const fullSystemPrompt = contextualInfo 
        ? `${baseSystemPrompt}\n\nContextual information: ${contextualInfo}`
        : baseSystemPrompt;
      
      return {
        contextualInfo,
        systemPrompt: fullSystemPrompt
      };
    } catch (error) {
      logger.error(`Error processing RAG: ${error.message}`);
      return { 
        contextualInfo: '',
        systemPrompt: session.systemPrompt || "You are a helpful AI assistant."
      };
    }
  },
  
  /**
   * Get a session by ID
   * @param {string} sessionId - Session ID
   * @returns {object|null} - Session data or null if not found
   */
  getSession(sessionId) {
    return activeSessions.get(sessionId) || null;
  },
  
  /**
   * Get all active sessions
   * @returns {Array} - Array of active session data
   */
  getAllActiveSessions() {
    const sessions = [];
    activeSessions.forEach(session => {
      sessions.push({
        id: session.id,
        model: session.model,
        voice: session.voice,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        userId: session.userId,
        messageCount: session.messages.length
      });
    });
    return sessions;
  }
};

module.exports = realtimeService;
