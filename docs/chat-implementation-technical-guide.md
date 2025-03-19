# Chat GPT-like Implementation Technical Guide

This document provides a detailed technical breakdown of the chat GPT-like implementation, focusing on endpoints, data flow, and integration details.

## System Components

- **Frontend**: Next.js React application
- **Backend**: Express.js Node.js server
- **External APIs**: OpenAI GPT-4o, OpenAI Whisper, Hume AI TTS

## Backend Endpoints

### 1. `/api/chat` (POST)

**Purpose**: Process user messages and generate AI responses using OpenAI GPT-4o.

**Request Format**:
```json
{
  "userId": "string | optional",
  "message": "string | required",
  "systemPromptMode": "friendly | challenging | optional"
}
```

**Response Format**:
```json
{
  "id": "string | conversation ID",
  "response": "string | AI response text",
  "llmUsed": "string | model name (e.g., 'gpt-4o')"
}
```

**Implementation Details**:
```javascript
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
```

**OpenAI API Call Details**:
- **Endpoint**: `https://api.openai.com/v1/chat/completions`
- **Method**: POST
- **Headers**:
  - `Authorization: Bearer ${OPENAI_API_KEY}`
  - `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "model": "gpt-4o",
    "messages": [
      { "role": "system", "content": "system prompt text" },
      { "role": "user", "content": "user message text" }
    ]
  }
  ```
- **Response Structure**:
  ```json
  {
    "id": "chatcmpl-123",
    "object": "chat.completion",
    "created": 1677858242,
    "model": "gpt-4o",
    "choices": [
      {
        "message": {
          "role": "assistant",
          "content": "AI response text"
        },
        "index": 0,
        "finish_reason": "stop"
      }
    ],
    "usage": {
      "prompt_tokens": 13,
      "completion_tokens": 7,
      "total_tokens": 20
    }
  }
  ```

### 2. `/api/stt` (POST)

**Purpose**: Convert speech to text using OpenAI's Whisper API.

**Request Format**:
- Content-Type: `multipart/form-data`
- Form field: `audio` (file)

**Response Format**:
```json
{
  "message": "Audio transcribed successfully",
  "transcript": "string | transcribed text"
}
```

**Implementation Details**:
```javascript
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
```

**Whisper API Call Details**:
- **Endpoint**: `https://api.openai.com/v1/audio/transcriptions`
- **Method**: POST
- **Headers**:
  - `Authorization: Bearer ${OPENAI_API_KEY}`
  - `Content-Type: multipart/form-data`
- **Request Body**:
  - `file`: Audio file binary data
  - `model`: "whisper-1"
- **Response Structure**:
  ```json
  {
    "text": "Transcribed text from the audio file"
  }
  ```

### 3. `/api/tts` (POST)

**Purpose**: Convert text to speech using Hume AI's TTS API.

**Request Format**:
```json
{
  "text": "string | required"
}
```

**Response Format**:
```json
{
  "message": "TTS generated successfully",
  "audioUrl": "string | URL to audio file"
}
```

**Implementation Details**:
```javascript
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
```

**Hume AI TTS API Call Details**:
- **Endpoint**: `https://api.hume.ai/v0/tts`
- **Method**: POST
- **Headers**:
  - `X-Hume-Api-Key: ${HUME_API_KEY}`
  - `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "utterances": [
      {
        "text": "Text to convert to speech",
        "description": "A friendly and professional voice with a warm, natural tone"
      }
    ]
  }
  ```
- **Response Structure**:
  ```json
  {
    "generations": [
      {
        "audio": "base64-encoded-audio-data",
        "config": { ... },
        "id": "generation-id"
      }
    ]
  }
  ```

### 4. `/api/logs` (GET)

**Purpose**: Retrieve conversation logs.

**Response Format**:
```json
[
  {
    "id": "string",
    "userId": "string",
    "userMessage": "string",
    "aiResponse": "string",
    "llmUsed": "string",
    "rating": "boolean | null",
    "timestamp": "string | ISO date"
  }
]
```

**Implementation Details**:
```javascript
app.get('/api/logs', (req, res) => {
  try {
    const logs = getLogs();
    res.json(logs);
  } catch (error) {
    console.error('Error in logs endpoint:', error);
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});
```

### 5. `/api/rate` (POST)

**Purpose**: Rate conversation responses.

**Request Format**:
```json
{
  "id": "string | conversation ID",
  "rating": "boolean"
}
```

**Response Format**:
```json
{
  "success": "boolean"
}
```

**Implementation Details**:
```javascript
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
```

### 6. `/audio/:filename` (GET)

**Purpose**: Serve audio files generated by the TTS API.

**Implementation Details**:
```javascript
app.use('/audio', express.static(path.join(__dirname)));
```

## Frontend API Service

The frontend communicates with the backend through a service layer defined in `api.ts`:

```typescript
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3003';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ChatRequest {
  userId?: string;
  message: string;
  systemPromptMode?: 'friendly' | 'challenging';
}

export interface ChatResponse {
  id: string;
  response: string;
  llmUsed: string;
}

export interface LogEntry {
  id: string;
  userId: string;
  userMessage: string;
  aiResponse: string;
  llmUsed: string;
  rating: boolean | null;
  timestamp: string;
}

export interface RateRequest {
  id: string;
  rating: boolean;
}

export interface TTSRequest {
  text: string;
}

export interface TTSResponse {
  audioUrl: string | null;
  message?: string;
}

// Chat API
export const sendChatMessage = async (chatRequest: ChatRequest): Promise<ChatResponse> => {
  const response = await api.post('/api/chat', chatRequest);
  return response.data;
};

// Logs API
export const getLogs = async (): Promise<LogEntry[]> => {
  const response = await api.get('/api/logs');
  return response.data;
};

// Rate API
export const rateResponse = async (rateRequest: RateRequest): Promise<{ success: boolean }> => {
  const response = await api.post('/api/rate', rateRequest);
  return response.data;
};

// TTS API
export const textToSpeech = async (ttsRequest: TTSRequest): Promise<TTSResponse> => {
  const response = await api.post('/api/tts', ttsRequest);
  return response.data;
};

// STT API
export const speechToText = async (audioFile: File): Promise<string> => {
  const formData = new FormData();
  formData.append('audio', audioFile);
  
  const response = await axios.post(`${API_URL}/api/stt`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data.transcript;
};
```

## Complete Data Flow

### Text Input Flow

1. **User Input to Backend**
   - User enters text in the input field in `ChatInterface.tsx`
   - `handleSubmit` function is triggered on form submission
   - User message is added to the messages state array
   - `sendChatMessage` function from `api.ts` is called with:
     ```typescript
     const chatRequest: ChatRequest = {
       message: input,
       systemPromptMode,
       userId: 'user-' + Date.now(),
     };
     ```
   - Axios sends a POST request to `http://localhost:3003/api/chat` with the request body

2. **Backend Processing**
   - Express server receives the request at the `/api/chat` endpoint
   - Request body is parsed and validated
   - System prompt is selected based on the `systemPromptMode` parameter
   - OpenAI client is used to make a request to the OpenAI API:
     ```javascript
     const completion = await openai.chat.completions.create({
       model: "gpt-4o",
       messages: [
         { role: "system", content: systemPrompt },
         { role: "user", content: message }
       ],
     });
     ```

3. **OpenAI API Interaction**
   - Request is sent to `https://api.openai.com/v1/chat/completions`
   - OpenAI processes the request and generates a response
   - Response is returned to the backend

4. **Backend to Frontend Response**
   - Backend extracts the AI response from the OpenAI API response:
     ```javascript
     const aiResponse = completion.choices[0].message.content;
     ```
   - Conversation is logged to `logs.json`
   - Response is sent back to the frontend:
     ```javascript
     res.json({
       id: logEntry.id,
       response: aiResponse,
       llmUsed: 'gpt-4o'
     });
     ```

5. **Frontend Display and TTS**
   - Frontend receives the response in the `sendChatMessage` promise resolution
   - Assistant message is added to the messages state array:
     ```typescript
     const assistantMessage: Message = {
       id: response.id,
       role: 'assistant',
       content: response.response,
       llmUsed: response.llmUsed,
     };
     setMessages((prev) => [...prev, assistantMessage]);
     ```
   - `textToSpeech` function from `api.ts` is called to convert the response to speech:
     ```typescript
     const ttsResponse = await textToSpeech({ text: response.response });
     ```
   - Axios sends a POST request to `http://localhost:3003/api/tts` with the text

6. **TTS Processing**
   - Backend receives the request at the `/api/tts` endpoint
   - Request to Hume AI TTS API is made:
     ```javascript
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
     ```
   - Hume AI processes the request and returns base64-encoded audio
   - Backend saves the audio to a temporary file
   - URL to the audio file is returned to the frontend:
     ```javascript
     res.json({
       message: 'TTS generated successfully',
       audioUrl: `/audio/${path.basename(tempFilePath)}`
     });
     ```

7. **Audio Playback**
   - Frontend receives the audio URL
   - Audio URL is set in state:
     ```typescript
     setAudioUrl(ttsResponse.audioUrl);
     ```
   - `useEffect` hook detects the change in `audioUrl` and plays the audio:
     ```typescript
     useEffect(() => {
       if (audioUrl && audioRef.current) {
         setIsPlayingAudio(true);
         audioRef.current.play()
           .catch(error => console.error('Error playing audio:', error))
           .finally(() => setIsPlayingAudio(false));
       }
     }, [audioUrl]);
     ```

### Voice Input Flow

1. **Recording Initiation**
   - User clicks the microphone button in `ChatInterface.tsx`
   - `handleRecordToggle` function is triggered
   - Browser's MediaDevices API is used to access the microphone:
     ```typescript
     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
     ```
   - MediaRecorder is initialized and started:
     ```typescript
     const mediaRecorder = new MediaRecorder(stream);
     mediaRecorderRef.current = mediaRecorder;
     audioChunksRef.current = [];
     
     mediaRecorder.ondataavailable = (event) => {
       if (event.data.size > 0) {
         audioChunksRef.current.push(event.data);
       }
     };
     
     mediaRecorder.start();
     ```

2. **Recording Completion**
   - User clicks the microphone button again to stop recording
   - MediaRecorder is stopped:
     ```typescript
     mediaRecorderRef.current.stop();
     ```
   - Audio chunks are collected and processed after a short delay:
     ```typescript
     setTimeout(async () => {
       try {
         const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
         const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
         
         // Send to STT API
         const transcript = await speechToText(audioFile);
         // ...
       } catch (error) {
         // ...
       }
     }, 500);
     ```

3. **Speech-to-Text Processing**
   - `speechToText` function from `api.ts` is called with the audio file
   - FormData is created with the audio file:
     ```typescript
     const formData = new FormData();
     formData.append('audio', audioFile);
     ```
   - Axios sends a POST request to `http://localhost:3003/api/stt` with the form data

4. **Backend STT Processing**
   - Express server receives the request at the `/api/stt` endpoint
   - Multer middleware processes the uploaded file
   - FormData is created for the Whisper API:
     ```javascript
     const formData = new FormData();
     formData.append('file', req.file.buffer, {
       filename: 'audio.webm',
       contentType: req.file.mimetype
     });
     formData.append('model', 'whisper-1');
     ```
   - Request is sent to the OpenAI Whisper API:
     ```javascript
     const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', 
       formData,
       {
         headers: {
           ...formData.getHeaders(),
           'Authorization': `Bearer ${OPENAI_API_KEY}`
         }
       }
     );
     ```

5. **Whisper API Processing**
   - OpenAI Whisper API processes the audio and returns a transcript
   - Backend extracts the transcript and sends it back to the frontend:
     ```javascript
     res.json({
       message: 'Audio transcribed successfully',
       transcript: response.data.text
     });
     ```

6. **Frontend Processing**
   - Frontend receives the transcript
   - Messages state is updated with the transcript as a user message:
     ```typescript
     setMessages(prev => {
       const newMessages = [...prev];
       // Replace the last message
       if (newMessages.length > 0) {
         newMessages[newMessages.length - 1] = {
           role: 'user',
           content: transcript
         };
       }
       return newMessages;
     });
     ```
   - Transcript is sent to the chat API using the same flow as text input:
     ```typescript
     const chatRequest: ChatRequest = {
       message: transcript,
       systemPromptMode,
       userId: 'user-' + Date.now(),
     };
     
     const response = await sendChatMessage(chatRequest);
     ```
   - The rest of the flow follows the text input flow (steps 2-7)

## Error Handling

### Frontend Error Handling

- **Chat API Errors**:
  ```typescript
  try {
    // API call
  } catch (error) {
    console.error('Error sending message:', error);
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: 'Sorry, there was an error processing your request. Please try again later.' },
    ]);
  } finally {
    setIsLoading(false);
  }
  ```

- **TTS API Errors**:
  ```typescript
  try {
    const ttsResponse = await textToSpeech({ text: response.response });
    // Process response
  } catch (error) {
    console.error('Error converting text to speech:', error);
    // Continue without audio
  }
  ```

- **STT API Errors**:
  ```typescript
  try {
    const transcript = await speechToText(audioFile);
    // Process transcript
  } catch (error) {
    console.error('Error processing audio:', error);
    setMessages(prev => {
      const newMessages = [...prev];
      if (newMessages.length > 0) {
        newMessages[newMessages.length - 1] = {
          role: 'user',
          content: 'Error processing voice message. Please try again or type your message.'
        };
      }
      return newMessages;
    });
  }
  ```

### Backend Error Handling

- **Chat API Errors**:
  ```javascript
  try {
    // Process request
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
  ```

- **TTS API Errors**:
  ```javascript
  try {
    // Process request
  } catch (error) {
    console.error('Error calling Hume TTS API:', error);
    res.status(500).json({ 
      error: 'Failed to generate speech', 
      details: error.message,
      message: 'TTS functionality encountered an error',
      audioUrl: null
    });
  }
  ```

- **STT API Errors**:
  ```javascript
  try {
    // Process request
  } catch (error) {
    console.error('Error calling OpenAI Whisper API:', error);
    res.status(500).json({ 
      error: 'Failed to transcribe audio', 
      details: error.message,
      transcript: 'Error transcribing audio'
    });
  }
  ```

## Configuration and Environment Variables

The backend uses environment variables for configuration:

```javascript
// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3003;

// API Keys - hardcoded for development, should use environment variables in production
const OPENAI_API_KEY = "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";
const HUME_API_KEY = "4byA53kdisP18y31L0JCrPhcTcBQc9j7p02WKVUVAZyshZu0";
```

The frontend uses environment variables for the backend URL:

```typescript
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3003';
```

## Data Storage

Conversation logs are stored in a JSON file:

```javascript
// Ensure logs directory exists
const LOGS_PATH = path.join(__dirname, 'logs.json');
if (!fs.existsSync(LOGS_PATH)) {
  fs.writeJSONSync(LOGS_PATH, []);
}

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
```

## System Prompts

The backend defines system prompts to control the AI's behavior:

```javascript
// Define system prompts
const SYSTEM_PROMPTS = {
  friendly: "You are a friendly AI assistant, very supportive and encouraging. You aim to help the user feel comfortable and confident.",
  challenging: "You are a challenging AI assistant that pushes users to think critically. You question assumptions and encourage deeper analysis."
};
```

## Audio File Handling

The backend handles audio files using multer:

```javascript
// Configure multer for file uploads (for audio files)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});
```

Temporary audio files from TTS are stored in the backend directory and served via a static route:

```javascript
// Serve audio files
app.use('/audio', express.static(path.join(__dirname)));
```

Temporary files are cleaned up after 5 minutes:

```javascript
// Clean up the file after a while (optional)
setTimeout(() => {
  try {
    fs.unlinkSync(tempFilePath);
  } catch (err) {
    console.error('Error deleting temporary audio file:', err);
  }
}, 5 * 60 * 1000); // Delete after 5 minutes
```

## Browser Media API Usage

The frontend uses the browser's MediaDevices API for audio recording:

```typescript
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const mediaRecorder = new MediaRecorder(stream);
```

Audio data is collected using the `ondataavailable` event:

```typescript
mediaRecorder.ondataavailable = (event) => {
  if (event.data.size > 0) {
    audioChunksRef.current.push(event.data);
  }
};
```

Audio playback is handled using the HTML5 audio element:

```typescript
<audio 
  ref={audioRef} 
  src={audioUrl || ''} 
  className="hidden" 
  onEnded={() => setIsPlayingAudio(false)}
  onError={() => setIsPlayingAudio(false)}
/>
```

## Conclusion

This implementation provides a complete chat GPT-like experience with voice capabilities by integrating:

1. **OpenAI GPT-4o** for natural language processing via the `/api/chat` endpoint
2. **OpenAI Whisper** for speech-to-text conversion via the `/api/stt` endpoint
3. **Hume AI** for text-to-speech conversion via the `/api/tts` endpoint

The system follows a RESTful API design pattern with clear separation between frontend and backend components. The frontend handles user interactions and UI rendering, while the backend manages API integrations and data persistence.
