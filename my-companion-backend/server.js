require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { OpenAI } = require('openai');
const axios = require('axios');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Configure multer for file uploads (for voice input)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Get API keys (check both with and without NEXT_PUBLIC_ prefix)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const HUME_API_KEY = process.env.HUME_API_KEY || process.env.NEXT_PUBLIC_HUME_API_KEY;
const HUME_SECRET_KEY = process.env.HUME_SECRET_KEY || process.env.NEXT_PUBLIC_HUME_SECRET_KEY;

// Initialize OpenAI client if API key is available
let openai = null;
if (OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: OPENAI_API_KEY
  });
}

// System prompts
const friendlyPrompt = "You are a friendly AI assistant, very supportive and encouraging. You provide helpful information in a positive and uplifting manner.";
const challengingPrompt = "You are a tough AI assistant, challenging assumptions and pushing users to think critically. You ask probing questions and encourage deeper analysis.";

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Logs file path
const logsFilePath = path.join(logsDir, 'logs.json');

// Initialize logs file if it doesn't exist
if (!fs.existsSync(logsFilePath)) {
  fs.writeFileSync(logsFilePath, JSON.stringify([], null, 2));
}

// Helper function to read logs
const readLogs = () => {
  try {
    const data = fs.readFileSync(logsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading logs:', error);
    return [];
  }
};

// Helper function to write logs
const writeLogs = (logs) => {
  try {
    fs.writeFileSync(logsFilePath, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Error writing logs:', error);
  }
};

// API Endpoints

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { userId, message, systemPromptMode = 'friendly' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Select system prompt based on mode
    const systemPrompt = systemPromptMode.toLowerCase() === 'friendly' ? friendlyPrompt : challengingPrompt;
    
    // Check if OpenAI API key is available
    if (!openai) {
      const mockResponse = "This is a mock response. Please set up your OpenAI API key in the .env file to get real responses.";
      
      // Log the conversation with mock response
      const logs = readLogs();
      const conversationEntry = {
        id: Date.now().toString(),
        userId: userId || 'anonymous',
        userMessage: message,
        aiResponse: mockResponse,
        llmUsed: 'Mock (No API Key)',
        rating: null,
        timestamp: new Date().toISOString()
      };
      
      logs.push(conversationEntry);
      writeLogs(logs);
      
      return res.json({
        response: mockResponse,
        llmUsed: 'Mock (No API Key)',
        id: conversationEntry.id,
        warning: 'Using mock response. Please set up your OpenAI API key in the .env file.'
      });
    }
    
    // Use OpenAI GPT-4o
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ]
    });
    
    const llmResponse = completion.choices[0].message.content;
    const llmUsed = 'OpenAI GPT-4o';
    
    // Log the conversation
    const logs = readLogs();
    const conversationEntry = {
      id: Date.now().toString(),
      userId: userId || 'anonymous',
      userMessage: message,
      aiResponse: llmResponse,
      llmUsed,
      rating: null,
      timestamp: new Date().toISOString()
    };
    
    logs.push(conversationEntry);
    writeLogs(logs);
    
    // Return response
    res.json({
      response: llmResponse,
      llmUsed,
      id: conversationEntry.id
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

// TTS endpoint (Text-to-Speech)
app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    // Check if Hume API key is available
    if (!HUME_API_KEY) {
      return res.json({
        message: 'TTS functionality requires Hume API key. Please set HUME_API_KEY in your .env file.',
        text,
        audioUrl: null
      });
    }
    
    // Implement Hume TTS integration
    try {
      const humeApiUrl = 'https://api.hume.ai/v0/synthesize/speech';
      
      const payload = {
        text,
        voice_id: 'male_01', // Default voice, can be parameterized
        prosody: {
          rate: 1.0,  // Normal speaking rate
          pitch: 1.0  // Normal pitch
        }
      };
      
      const response = await axios.post(humeApiUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Hume-Api-Key': HUME_API_KEY
        },
        responseType: 'arraybuffer'
      });
      
      // Create a temporary file to store the audio
      const tempFileName = `tts_${Date.now()}.mp3`;
      const tempFilePath = path.join(__dirname, 'logs', tempFileName);
      
      // Write the audio buffer to a file
      fs.writeFileSync(tempFilePath, response.data);
      
      // Create a URL to access the audio file
      const audioUrl = `/api/audio/${tempFileName}`;
      
      res.json({
        message: 'Text-to-speech conversion successful',
        text,
        audioUrl
      });
    } catch (error) {
      console.error('Error calling Hume TTS API:', error);
      res.json({
        message: 'Error calling Hume TTS API: ' + (error.message || 'Unknown error'),
        text,
        audioUrl: null
      });
    }
  } catch (error) {
    console.error('Error in TTS endpoint:', error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

// Serve audio files
app.get('/api/audio/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'logs', filename);
  
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'audio/mpeg');
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.status(404).json({ error: 'Audio file not found' });
  }
});

// STT endpoint (Speech-to-Text)
app.post('/api/stt', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }
    
    // Check if OpenAI API key is available (for Whisper API)
    if (!OPENAI_API_KEY) {
      return res.json({
        message: 'STT functionality requires OpenAI API key for Whisper. Please set OPENAI_API_KEY in your .env file.',
        transcription: null
      });
    }
    
    try {
      // Save the audio file temporarily
      const tempFilePath = path.join(__dirname, 'logs', `stt_${Date.now()}.webm`);
      fs.writeFileSync(tempFilePath, req.file.buffer);
      
      // Create a readable stream from the file
      const audioReadStream = fs.createReadStream(tempFilePath);
      
      // Use OpenAI's Whisper API for transcription
      const transcription = await openai.audio.transcriptions.create({
        file: audioReadStream,
        model: "whisper-1",
      });
      
      // Delete the temporary file
      fs.unlinkSync(tempFilePath);
      
      res.json({
        message: 'Speech-to-text conversion successful',
        transcription: transcription.text
      });
    } catch (error) {
      console.error('Error calling Whisper API:', error);
      res.json({
        message: 'Error calling Whisper API: ' + (error.message || 'Unknown error'),
        transcription: null
      });
    }
  } catch (error) {
    console.error('Error in STT endpoint:', error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

// Logs endpoint
app.get('/api/logs', (req, res) => {
  try {
    const logs = readLogs();
    res.json(logs);
  } catch (error) {
    console.error('Error in logs endpoint:', error);
    res.status(500).json({ error: 'An error occurred while retrieving logs' });
  }
});

// Rate endpoint
app.post('/api/rate', (req, res) => {
  try {
    const { id, rating } = req.body;
    
    if (!id || rating === undefined) {
      return res.status(400).json({ error: 'ID and rating are required' });
    }
    
    const logs = readLogs();
    const logIndex = logs.findIndex(log => log.id === id);
    
    if (logIndex === -1) {
      return res.status(404).json({ error: 'Log entry not found' });
    }
    
    logs[logIndex].rating = rating;
    writeLogs(logs);
    
    res.json({ message: 'Rating updated successfully' });
  } catch (error) {
    console.error('Error in rate endpoint:', error);
    res.status(500).json({ error: 'An error occurred while updating the rating' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Log environment variable status
  console.log('Environment variables status:');
  console.log(`- OPENAI_API_KEY: ${OPENAI_API_KEY ? 'Set ' : 'Not set '}`);
  console.log(`- HUME_API_KEY: ${HUME_API_KEY ? 'Set ' : 'Not set '}`);
  console.log(`- HUME_SECRET_KEY: ${HUME_SECRET_KEY ? 'Set ' : 'Not set '}`);
});
