# AI Companion Backend

This is the backend server for the AI Companion application. It provides API endpoints for chat, text-to-speech, speech-to-text, logs, and ratings.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in this directory with the following variables:
   ```
   OPENAI_API_KEY=your_openai_api_key
   DEEPSEEK_API_KEY=your_deepseek_api_key (optional)
   HUME_API_KEY=your_hume_api_key
   PORT=3003 (optional, defaults to 3003)
   ```

3. Start the server:
   ```
   npm start
   ```

## Testing

You can run the included test script to verify that all endpoints are working correctly:

```
node test.js
```

This will test the chat, logs, rate, and TTS endpoints and display the results.

## API Endpoints

### Chat
- **URL**: `/api/chat`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "userId": "user123",
    "message": "Hello, how are you?",
    "systemPromptMode": "friendly", // or "challenging"
    "chosenLLM": "openai" // or "deepseek"
  }
  ```
- **Response**:
  ```json
  {
    "id": "1621532345678",
    "response": "I'm doing well, thank you for asking!",
    "llmUsed": "openai"
  }
  ```

### Text-to-Speech (TTS)
- **URL**: `/api/tts`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "text": "Text to convert to speech"
  }
  ```
- **Response**:
  ```json
  {
    "audioUrl": "url_to_audio_file"
  }
  ```

### Speech-to-Text (STT)
- **URL**: `/api/stt`
- **Method**: `POST`
- **Body**: Form data with an `audio` file
- **Response**:
  ```json
  {
    "transcript": "Transcribed text from audio"
  }
  ```

### Logs
- **URL**: `/api/logs`
- **Method**: `GET`
- **Response**:
  ```json
  [
    {
      "id": "1621532345678",
      "userId": "user123",
      "userMessage": "Hello, how are you?",
      "aiResponse": "I'm doing well, thank you for asking!",
      "llmUsed": "openai",
      "rating": null,
      "timestamp": "2023-05-20T12:34:56.789Z"
    }
  ]
  ```

### Rate
- **URL**: `/api/rate`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "id": "1621532345678",
    "rating": true // or false
  }
  ```
- **Response**:
  ```json
  {
    "success": true
  }
  ```

## Implementation Notes

- The server uses hardcoded API keys for development purposes. In a production environment, these should be stored securely in environment variables.
- The TTS and STT endpoints currently return placeholder responses. They will be fully implemented when the Hume API key is available.
- Conversation logs are stored in a local JSON file (`logs.json`). In a production environment, a database should be used for better scalability and reliability. 