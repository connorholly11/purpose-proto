const { PrismaClient } = require('@prisma/client');

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 * Database service for handling all database operations
 */
const dbService = {
  // User operations
  users: {
    /**
     * Get a user by ID
     * @param {string} id - User ID
     * @returns {Promise<object>} - User object
     */
    async getById(id) {
      return prisma.user.findUnique({
        where: { id },
        include: { conversations: true }
      });
    },

    /**
     * Create a new user
     * @param {object} userData - User data (name, email)
     * @returns {Promise<object>} - Created user
     */
    async create(userData) {
      return prisma.user.create({
        data: userData
      });
    },

    /**
     * Get or create a user
     * @param {string} id - User ID
     * @param {object} userData - Default user data if creating
     * @returns {Promise<object>} - User object
     */
    async getOrCreate(id, userData = {}) {
      const user = await prisma.user.findUnique({
        where: { id }
      });

      if (!user) {
        return prisma.user.create({
          data: { id, ...userData }
        });
      }

      return user;
    },

    /**
     * Get all users
     * @returns {Promise<Array>} List of users
     */
    async getAll() {
      return await prisma.user.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });
    },

    /**
     * Count all users
     * @returns {Promise<number>} User count
     */
    async count() {
      return await prisma.user.count();
    },
  },

  // Conversation operations
  conversations: {
    /**
     * Get a conversation by ID
     * @param {string} id - Conversation ID
     * @returns {Promise<object>} - Conversation with messages
     */
    async getById(id) {
      return prisma.conversation.findUnique({
        where: { id },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });
    },

    /**
     * Get conversations for a user
     * @param {string} userId - User ID
     * @returns {Promise<Array>} - List of conversations
     */
    async getByUser(userId) {
      return prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1 // Just get the latest message for preview
          }
        }
      });
    },

    /**
     * Create a new conversation
     * @param {object} data - Conversation data (userId, title)
     * @returns {Promise<object>} - Created conversation
     */
    async create(data) {
      return prisma.conversation.create({
        data
      });
    },

    /**
     * Update a conversation
     * @param {string} id - Conversation ID
     * @param {object} data - Data to update
     * @returns {Promise<object>} - Updated conversation
     */
    async update(id, data) {
      return prisma.conversation.update({
        where: { id },
        data
      });
    },

    /**
     * Count all conversations
     * @returns {Promise<number>} Conversation count
     */
    async count() {
      return await prisma.conversation.count();
    },
    
    /**
     * Count conversations by user
     * @param {string} userId - User ID
     * @returns {Promise<number>} Conversation count for user
     */
    async countByUser(userId) {
      return await prisma.conversation.count({
        where: {
          userId
        }
      });
    },
  },

  // Message operations
  messages: {
    /**
     * Get all messages for a conversation
     * @param {string} conversationId - Conversation ID
     * @returns {Promise<Array>} - List of messages
     */
    async getByConversation(conversationId) {
      return prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' }
      });
    },

    /**
     * Create a new message
     * @param {object} data - Message data (conversationId, role, content, etc.)
     * @returns {Promise<object>} - Created message
     */
    async create(data) {
      const message = await prisma.message.create({
        data
      });

      // Update the conversation's updatedAt timestamp
      await prisma.conversation.update({
        where: { id: data.conversationId },
        data: { updatedAt: new Date() }
      });

      return message;
    },

    /**
     * Create a user and assistant message pair
     * @param {object} userMessageData - User message data
     * @param {object} assistantMessageData - Assistant message data
     * @returns {Promise<Array>} - Created messages
     */
    async createPair(userMessageData, assistantMessageData) {
      return prisma.$transaction([
        prisma.message.create({ data: userMessageData }),
        prisma.message.create({ data: assistantMessageData }),
        prisma.conversation.update({
          where: { id: userMessageData.conversationId },
          data: { updatedAt: new Date() }
        })
      ]);
    },

    /**
     * Count all messages
     * @returns {Promise<number>} Message count
     */
    async count() {
      return await prisma.message.count();
    },
  },

  // Vector operations (for RAG)
  vectors: {
    /**
     * Create a new vector
     * @param {object} data - Vector data (content, embedding, metadata)
     * @returns {Promise<object>} - Created vector
     */
    async create(data) {
      return prisma.vector.create({
        data
      });
    },

    /**
     * Get all vectors
     * @returns {Promise<Array>} - List of vectors
     */
    async getAll() {
      return prisma.vector.findMany();
    }
  },

  // Log operations
  logs: {
    /**
     * Create a new log entry
     * @param {object} data - Log data (userId, type, data, rating)
     * @returns {Promise<object>} - Created log
     */
    async create(data) {
      return prisma.log.create({
        data
      });
    },

    /**
     * Get a log by ID
     * @param {string} id - Log ID
     * @returns {Promise<object>} - Log object or null if not found
     */
    async getById(id) {
      return prisma.log.findUnique({
        where: { id }
      });
    },
    
    /**
     * Get logs by type
     * @param {string} type - Log type (chat, error, etc.)
     * @returns {Promise<Array>} - List of logs
     */
    async getByType(type) {
      return prisma.log.findMany({
        where: { type },
        orderBy: { createdAt: 'desc' }
      });
    },

    /**
     * Get logs by user
     * @param {string} userId - User ID
     * @returns {Promise<Array>} - List of logs
     */
    async getByUser(userId) {
      return prisma.log.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
    },

    /**
     * Update a log entry (e.g., to add a rating)
     * @param {string} id - Log ID
     * @param {object} data - Data to update
     * @returns {Promise<object>} - Updated log
     */
    async update(id, data) {
      return prisma.log.update({
        where: { id },
        data
      });
    },

    /**
     * Get all logs with optional limit
     * @param {number} limit - Maximum number of logs to return
     * @returns {Promise<Array>} List of logs
     */
    async getAll(limit = 100) {
      return await prisma.log.findMany({
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      });
    },
    
    /**
     * Get logs by type with optional limit
     * @param {string} type - Log type
     * @param {number} limit - Maximum number of logs to return
     * @returns {Promise<Array>} List of logs
     */
    async getByTypeWithLimit(type, limit = 100) {
      return await prisma.log.findMany({
        where: {
          type
        },
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      });
    },
  }
};

module.exports = dbService;
