const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const http = require('http');

// Import services
const dbService = require('./services/database');
const openaiService = require('./services/openai');
const ragService = require('./services/rag');
const realtimeService = require('./services/openai/realtime');

// Import controllers
const adminController = require('./controllers/admin');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads (for audio files)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Define system prompts
const SYSTEM_PROMPTS = {
  friendly: "You are a friendly AI assistant, very supportive and encouraging. You aim to help the user feel comfortable and confident.",
  challenging: "You are a challenging AI assistant that pushes users to think critically. You question assumptions and encourage deeper analysis."
};

// Serve static files for audio
app.use('/audio', express.static(path.join(__dirname, 'temp')));

// Ensure temp directory exists for audio files
const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Create HTTP server
const server = http.createServer(app);

// API Routes

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { userId, message, systemPromptMode = 'friendly', conversationId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create user
    const user = userId ? await dbService.users.getOrCreate(userId, { name: 'Anonymous User' }) : null;
    
    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await dbService.conversations.getById(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
    } else {
      // Create a new conversation with the first few words as title
      const title = message.slice(0, 30) + (message.length > 30 ? '...' : '');
      conversation = await dbService.conversations.create({
        title,
        userId: user?.id
      });
    }

    // Get conversation history for context
    const messages = await dbService.messages.getByConversation(conversation.id);
    const conversationHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Select system prompt based on mode
    const systemPrompt = SYSTEM_PROMPTS[systemPromptMode] || SYSTEM_PROMPTS.friendly;
    
    // Add user message to database
    const userMessage = await dbService.messages.create({
      conversationId: conversation.id,
      role: 'user',
      content: message
    });
    
    // Use RAG to generate response with relevant context
    const ragResponse = await ragService.generateResponse(
      message,
      [...conversationHistory, { role: 'user', content: message }],
      systemPrompt
    );
    
    // Add assistant message to database
    const assistantMessage = await dbService.messages.create({
      conversationId: conversation.id,
      role: 'assistant',
      content: ragResponse.response,
      llmUsed: ragResponse.model
    });
    
    // Log the interaction
    await dbService.logs.create({
      userId: user?.id,
      type: 'chat',
      data: {
        query: message,
        response: ragResponse.response,
        model: ragResponse.model,
        contextUsed: ragResponse.contextUsed
      }
    });
    
    // Return response
    res.json({
      id: assistantMessage.id,
      response: ragResponse.response,
      llmUsed: ragResponse.model,
      conversationId: conversation.id
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

// TTS endpoint
app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    // Generate TTS audio
    const audioBuffer = await openaiService.textToSpeech(text);
    
    // Create a unique filename
    const filename = `tts_${Date.now()}.mp3`;
    const filePath = path.join(TEMP_DIR, filename);
    
    // Write the audio buffer to file
    await fs.writeFile(filePath, audioBuffer);
    
    // Return the URL to the audio file
    res.json({
      message: 'TTS generated successfully',
      audioUrl: `/audio/${filename}`
    });
    
    // Clean up the file after 5 minutes (optional)
    setTimeout(() => {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Error deleting temporary audio file:', err);
      }
    }, 5 * 60 * 1000);
  } catch (error) {
    console.error('Error in TTS endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to generate speech', 
      details: error.message,
      message: 'TTS functionality encountered an error',
      audioUrl: null
    });
  }
});

// STT endpoint
app.post('/api/stt', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }
    
    console.log('Received audio file:', req.file.originalname, 'Size:', req.file.size);
    
    // Convert the audio to text
    const transcript = await openaiService.speechToText(req.file.buffer);
    
    console.log('Transcription result:', transcript);
    
    // Log the STT request
    await dbService.logs.create({
      type: 'stt',
      data: {
        fileSize: req.file.size,
        transcript
      }
    });
    
    res.json({
      transcript
    });
  } catch (error) {
    console.error('Error in STT endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to transcribe audio',
      details: error.message 
    });
  }
});

// Get conversation history
app.get('/api/conversations', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const conversations = await dbService.conversations.getByUser(userId);
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages for a conversation
app.get('/api/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    
    const messages = await dbService.messages.getByConversation(id);
    res.json(messages);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
});

// Logs API - get all logs
app.get('/api/logs', async (req, res) => {
  try {
    const { type } = req.query;
    
    let logs;
    if (type) {
      logs = await dbService.logs.getByType(type);
    } else {
      // Get all logs from all types
      const chatLogs = await dbService.logs.getByType('chat');
      const sttLogs = await dbService.logs.getByType('stt');
      const errorLogs = await dbService.logs.getByType('error');
      
      logs = [...chatLogs, ...sttLogs, ...errorLogs].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
    }
    
    res.json(logs);
  } catch (error) {
    console.error('Error getting logs:', error);
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});

// Rate a response
app.post('/api/rate', async (req, res) => {
  try {
    const { id, rating } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Log ID is required' });
    }
    
    if (rating === undefined) {
      return res.status(400).json({ error: 'Rating is required' });
    }
    
    // Update the log with the rating
    try {
      // First check if the log exists
      const log = await dbService.logs.getById(id);
      if (!log) {
        return res.status(404).json({ error: 'Log not found' });
      }
      
      await dbService.logs.update(id, {
        rating: Boolean(rating)
      });
      
      res.json({
        success: true
      });
    } catch (error) {
      console.error('Error rating response:', error);
      res.status(500).json({ error: 'Failed to rate response' });
    }
  } catch (error) {
    console.error('Error rating response:', error);
    res.status(500).json({ error: 'Failed to rate response' });
  }
});

// Index knowledge for RAG
app.post('/api/knowledge', async (req, res) => {
  try {
    const { text, metadata } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    // Index the text for RAG
    const result = await ragService.indexText(text, metadata || {});
    
    res.json({
      success: true,
      id: result.id
    });
  } catch (error) {
    console.error('Error indexing knowledge:', error);
    res.status(500).json({ error: 'Failed to index knowledge' });
  }
});

// Add endpoint to get WebSocket connection status
app.get('/api/realtime/status', (req, res) => {
  try {
    const activeSessions = realtimeService.getAllActiveSessions();
    res.json({
      status: 'online',
      activeSessions: activeSessions.length,
      message: 'Realtime API is running'
    });
  } catch (error) {
    console.error('Error getting Realtime API status:', error);
    res.status(500).json({ error: 'Failed to get Realtime API status' });
  }
});

// Create a Realtime API session with ephemeral token
app.post('/api/realtime/sessions', async (req, res) => {
  try {
    const { userId, systemPromptMode } = req.body;
    
    // Get system prompt based on mode
    const systemPrompt = systemPromptMode 
      ? (SYSTEM_PROMPTS[systemPromptMode] || SYSTEM_PROMPTS.friendly)
      : undefined;
    
    // Create a Realtime session
    const sessionData = await realtimeService.createRealtimeSession({
      model: process.env.REALTIME_MODEL || 'gpt-4o-realtime-preview-2024-12-17',
      voice: process.env.REALTIME_VOICE || 'verse',
      userId,
      systemPrompt
    });
    
    // Log the session creation
    await dbService.logs.create({
      userId,
      type: 'realtime_session',
      data: {
        sessionId: sessionData.sessionId,
        model: sessionData.model,
        voice: sessionData.voice
      }
    });
    
    res.json(sessionData);
  } catch (error) {
    console.error('Error creating Realtime session:', error);
    res.status(500).json({ 
      error: 'Failed to create Realtime session',
      details: error.message
    });
  }
});

// Store Realtime session data
app.post('/api/realtime/sessions/:sessionId/data', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const sessionData = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    // Store session data
    const result = await realtimeService.storeSessionData(sessionId, sessionData);
    
    if (!result) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error storing Realtime session data:', error);
    res.status(500).json({ error: 'Failed to store Realtime session data' });
  }
});

// Process text with RAG for Realtime API
app.post('/api/realtime/sessions/:sessionId/rag', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;
    
    if (!sessionId || !message) {
      return res.status(400).json({ error: 'Session ID and message are required' });
    }
    
    // Process with RAG
    const ragResult = await realtimeService.processWithRag(sessionId, message);
    
    res.json(ragResult);
  } catch (error) {
    console.error('Error processing RAG for Realtime session:', error);
    res.status(500).json({ error: 'Failed to process RAG for Realtime session' });
  }
});

// Admin routes
app.get('/api/admin/stats', adminController.getStats);
app.get('/api/admin/logs', adminController.getLogs);
app.get('/api/admin/users', adminController.getUsers);
app.post('/api/admin/knowledge', adminController.addToKnowledgeBase);
app.post('/api/admin/seed', adminController.runSeed);

// Import error handling middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Apply error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('OpenAI Realtime API with WebRTC is available at /api/realtime/sessions');
});

module.exports = server;