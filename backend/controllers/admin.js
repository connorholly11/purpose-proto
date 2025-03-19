/**
 * Admin Controller
 * Handles admin routes for the AI Companion application
 */

const dbService = require('../services/database');
const ragService = require('../services/rag');

/**
 * Get system statistics
 */
const getStats = async (req, res) => {
  try {
    // Get counts from database
    const userCount = await dbService.users.count();
    const conversationCount = await dbService.conversations.count();
    const messageCount = await dbService.messages.count();
    
    // Get all chat logs to calculate usage statistics
    const logs = await dbService.logs.getByTypeWithLimit('chat', 500);
    
    // Calculate average response time from logs
    const responseTimes = logs
      .filter(log => log.data && log.data.responseTime)
      .map(log => log.data.responseTime);
    
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 800; // Default if no logs
    
    // Calculate token usage from logs
    let totalTokens = 0;
    let completionTokens = 0;
    let embeddingTokens = 0;
    
    logs.forEach(log => {
      if (log.data && log.data.tokenUsage) {
        totalTokens += (log.data.tokenUsage.total || 0);
        completionTokens += (log.data.tokenUsage.completion || 0);
        embeddingTokens += (log.data.tokenUsage.embedding || 0);
      } else {
        // If no token usage data, estimate based on text length
        const queryTokens = Math.ceil((log.data.query?.length || 0) / 4);
        const responseTokens = Math.ceil((log.data.response?.length || 0) / 4);
        
        completionTokens += responseTokens;
        embeddingTokens += queryTokens;
        totalTokens += (queryTokens + responseTokens);
      }
    });
    
    // Get embedding logs to add to embedding token count
    const embeddingLogs = await dbService.logs.getByTypeWithLimit('embedding', 200);
    embeddingLogs.forEach(log => {
      if (log.data && log.data.tokenCount) {
        embeddingTokens += log.data.tokenCount;
        totalTokens += log.data.tokenCount;
      }
    });
    
    const tokenUsage = {
      total: totalTokens,
      completion: completionTokens,
      embedding: embeddingTokens
    };
    
    res.json({
      userCount,
      conversationCount,
      messageCount,
      averageResponseTime,
      tokenUsage
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

/**
 * Get system logs
 */
const getLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = await dbService.logs.getAll(limit);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
};

/**
 * Get all users
 */
const getUsers = async (req, res) => {
  try {
    const users = await dbService.users.getAll();
    
    // Enhance users with conversation counts
    const enhancedUsers = await Promise.all(
      users.map(async (user) => {
        const conversationCount = await dbService.conversations.countByUser(user.id);
        return { 
          ...user, 
          conversationCount 
        };
      })
    );
    
    res.json(enhancedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

/**
 * Add content to the knowledge base
 */
const addToKnowledgeBase = async (req, res) => {
  try {
    const { content, title, source } = req.body;
    
    if (!content || !title) {
      return res.status(400).json({ error: 'Content and title are required' });
    }
    
    // Add to RAG system
    const result = await ragService.addDocument(content, { title, source });
    
    res.json({ 
      success: true, 
      id: result.id,
      message: 'Content added to knowledge base successfully' 
    });
  } catch (error) {
    console.error('Error adding to knowledge base:', error);
    res.status(500).json({ error: 'Failed to add content to knowledge base' });
  }
};

/**
 * Run the seed script
 */
const runSeed = async (req, res) => {
  try {
    // Import and execute the seed function
    const { PrismaClient } = require('@prisma/client');
    const openaiService = require('../services/openai');
    const pineconeService = require('../services/pinecone');
    const fs = require('fs');
    const path = require('path');
    
    // Initialize Prisma client
    const prisma = new PrismaClient();
    
    // Sample knowledge base content
    const knowledgeBase = [
      {
        title: "AI Companion Features",
        content: "The AI Companion app features both text and voice interactions, using OpenAI's GPT-4o for generating responses, Whisper for speech-to-text, and TTS-1 for text-to-speech. It includes conversation management, RAG for better context awareness, and a modern responsive UI."
      },
      {
        title: "Technical Architecture",
        content: "The application uses a Next.js frontend with Express.js backend. It uses Prisma ORM with a Supabase PostgreSQL database, OpenAI for AI capabilities, and Pinecone for vector storage in the RAG implementation."
      },
      {
        title: "User Experience",
        content: "The UI features a conversation sidebar for managing chats, a mode selector for switching between friendly and challenging AI personalities, and both text and voice input options for user interaction."
      }
    ];
    
    console.log('🌱 Starting seed process from admin endpoint...');

    // Create sample users
    console.log('Creating sample users...');
    const users = await Promise.all([
      prisma.user.upsert({
        where: { id: 'admin-user-1' },
        update: {},
        create: {
          id: 'admin-user-1',
          name: 'Admin User',
          email: 'admin@example.com'
        }
      })
    ]);
    
    // Create knowledge base entries
    console.log('Creating knowledge base entries...');
    for (const item of knowledgeBase) {
      console.log(`Processing item: ${item.title}`);
      
      // Generate embedding
      const embedding = await openaiService.generateEmbedding(item.content);
      
      // Store in database
      const vector = await prisma.vector.create({
        data: {
          content: item.content,
          metadata: {
            title: item.title,
            source: 'admin-seed'
          }
        }
      });
      
      // Store in Pinecone
      await pineconeService.upsertVectors([{
        id: vector.id,
        values: embedding,
        metadata: {
          title: item.title,
          source: 'admin-seed',
          text: item.content
        }
      }]);
      
      console.log(`✅ Added knowledge item: ${item.title}`);
    }
    
    await prisma.$disconnect();
    
    res.json({ 
      success: true,
      message: 'Admin seed completed successfully' 
    });
  } catch (error) {
    console.error('Error running seed:', error);
    res.status(500).json({ 
      error: 'Failed to run seed script',
      details: error.message
    });
  }
};

module.exports = {
  getStats,
  getLogs,
  getUsers,
  addToKnowledgeBase,
  runSeed
};
