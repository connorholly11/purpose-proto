# AI Companion Backend

This is the backend server for the AI Companion application. It provides API endpoints for chat, text-to-speech, speech-to-text, logs, and rating functionality.

## Setup Instructions

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the root directory of the project (one level up from this directory) with the following environment variables:
   ```
   OPENAI_API_KEY=your_openai_api_key
   HUME_API_KEY=your_hume_api_key
   HUME_SECRET_KEY=your_hume_secret_key
   PORT=3002 (optional, defaults to 3002)
   ```

3. Start the server:
   ```
   npm start
   ```

## API Endpoints

### Chat
- **POST /api/chat**
  - Request body: `{ userId, message, systemPromptMode }`
  - Response: `{ response, llmUsed, id }`

### Text-to-Speech (TTS)
- **POST /api/tts**
  - Request body: `{ text }`
  - Response: `{ message, text, audioUrl }`

### Speech-to-Text (STT)
- **POST /api/stt**
  - Request: Form data with audio file
  - Response: `{ message, transcription }`

### Logs
- **GET /api/logs**
  - Response: Array of conversation logs

### Rate
- **POST /api/rate**
  - Request body: `{ id, rating }`
  - Response: `{ message }`

## Environment Variables

- **OPENAI_API_KEY**: API key for OpenAI (required)
- **HUME_API_KEY**: API key for Hume TTS services (required for voice features)
- **HUME_SECRET_KEY**: Secret key for Hume services (required for voice features)
- **PORT**: Port for the server to listen on (optional, defaults to 3002)
