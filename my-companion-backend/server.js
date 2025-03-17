const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const { OpenAI } = require('openai');
const axios = require('axios');
const FormData = require('form-data');

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

// API Keys - hardcoded for development, should use environment variables in production
const OPENAI_API_KEY = "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";
const HUME_API_KEY = "4byA53kdisP18y31L0JCrPhcTcBQc9j7p02WKVUVAZyshZu0";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Ensure logs directory exists
const LOGS_PATH = path.join(__dirname, 'logs.json');
if (!fs.existsSync(LOGS_PATH)) {
  fs.writeJSONSync(LOGS_PATH, []);
}

// Define system prompts
const SYSTEM_PROMPTS = {
  friendly: "You are a friendly AI assistant, very supportive and encouraging. You aim to help the user feel comfortable and confident.",
  challenging: "You are a challenging AI assistant that pushes users to think critically. You question assumptions and encourage deeper analysis."
};

// Helper function to get logs
const getLogs = () => {
  try {
    return fs.readJSONSync(LOGS_PATH);
  } catch (error) {
    console.error('Error reading logs:', error);
    return [];
  }
};

// Helper function to save logs
const saveLogs = (logs) => {
  try {
    fs.writeJSONSync(LOGS_PATH, logs);
  } catch (error) {
    console.error('Error saving logs:', error);
  }
};

// API Routes

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { userId, message, systemPromptMode = 'friendly' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Select system prompt based on mode
    const systemPrompt = SYSTEM_PROMPTS[systemPromptMode] || SYSTEM_PROMPTS.friendly;
    
    // Call GPT-4o
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
    });
    
    const aiResponse = completion.choices[0].message.content;
    const llmUsed = 'gpt-4o';
    
    // Log the conversation
    const logs = getLogs();
    const logEntry = {
      id: Date.now().toString(),
      userId: userId || 'anonymous',
      userMessage: message,
      aiResponse,
      llmUsed,
      rating: null,
      timestamp: new Date().toISOString()
    };
    
    logs.push(logEntry);
    saveLogs(logs);
    
    // Return response
    res.json({
      id: logEntry.id,
      response: aiResponse,
      llmUsed
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
    
    // Call Hume TTS API
    try {
      const response = await axios.post('https://api.hume.ai/v0/tts', 
        {
          utterances: [
            {
              text: text,
              description: "A friendly and professional voice with a warm, natural tone"
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Hume-Api-Key': HUME_API_KEY
          }
        }
      );
      
      // Extract the audio data from the response
      if (response.data && response.data.generations && response.data.generations.length > 0) {
        const audioData = response.data.generations[0].audio;
        
        // Create a temporary file path for the audio
        const tempFilePath = path.join(__dirname, 'temp_audio_' + Date.now() + '.wav');
        
        // Write the base64 audio data to a file
        fs.writeFileSync(tempFilePath, Buffer.from(audioData, 'base64'));
        
        // Serve the file
        res.json({
          message: 'TTS generated successfully',
          audioUrl: `/audio/${path.basename(tempFilePath)}`
        });
        
        // Clean up the file after a while (optional)
        setTimeout(() => {
          try {
            fs.unlinkSync(tempFilePath);
          } catch (err) {
            console.error('Error deleting temporary audio file:', err);
          }
        }, 5 * 60 * 1000); // Delete after 5 minutes
      } else {
        throw new Error('Invalid response from Hume TTS API');
      }
    } catch (error) {
      console.error('Error calling Hume TTS API:', error);
      res.status(500).json({ 
        error: 'Failed to generate speech', 
        details: error.message,
        message: 'TTS functionality encountered an error',
        audioUrl: null
      });
    }
  } catch (error) {
    console.error('Error in TTS endpoint:', error);
    res.status(500).json({ error: 'Failed to process TTS request' });
  }
});

// Serve audio files
app.use('/audio', express.static(path.join(__dirname)));

// STT endpoint
app.post('/api/stt', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }
    
    // Use OpenAI's Whisper API for speech recognition
    try {
      const formData = new FormData();
      formData.append('file', req.file.buffer, {
        filename: 'audio.webm',
        contentType: req.file.mimetype
      });
      formData.append('model', 'whisper-1');
      
      const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', 
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          }
        }
      );
      
      if (response.data && response.data.text) {
        res.json({
          message: 'Audio transcribed successfully',
          transcript: response.data.text
        });
      } else {
        throw new Error('Invalid response from OpenAI Whisper API');
      }
    } catch (error) {
      console.error('Error calling OpenAI Whisper API:', error);
      res.status(500).json({ 
        error: 'Failed to transcribe audio', 
        details: error.message,
        transcript: 'Error transcribing audio'
      });
    }
  } catch (error) {
    console.error('Error in STT endpoint:', error);
    res.status(500).json({ error: 'Failed to process STT request' });
  }
});

// Logs endpoint
app.get('/api/logs', (req, res) => {
  try {
    const logs = getLogs();
    res.json(logs);
  } catch (error) {
    console.error('Error in logs endpoint:', error);
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});

// Rate endpoint
app.post('/api/rate', (req, res) => {
  try {
    const { id, rating } = req.body;
    
    if (!id || rating === undefined) {
      return res.status(400).json({ error: 'ID and rating are required' });
    }
    
    const logs = getLogs();
    const logIndex = logs.findIndex(log => log.id === id);
    
    if (logIndex === -1) {
      return res.status(404).json({ error: 'Log entry not found' });
    }
    
    logs[logIndex].rating = rating;
    saveLogs(logs);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error in rate endpoint:', error);
    res.status(500).json({ error: 'Failed to update rating' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 