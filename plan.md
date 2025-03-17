# AI Companion Project Plan

## Overview
We're building an AI companion application with both a backend and frontend for internal testing between three cofounders. The backend is a Node.js/Express server that integrates with OpenAI's GPT-4o for chat functionality and Hume for voice features. The frontend is a Next.js application with a modern UI using Tailwind CSS and shadcn/ui components.

## System Architecture

### Backend (Node.js/Express)
- API endpoints for chat, TTS, STT, logs, and rating
- Integration with OpenAI GPT-4o
- Integration with Hume for voice features
- Conversation logging and persistence

### Frontend (Next.js)
- Modern UI with Tailwind CSS and shadcn/ui
- Chat interface with text and voice capabilities
- System prompt selection (friendly vs. challenging)
- Conversation history with rating functionality

## Environment Variables

### Backend
- `OPENAI_API_KEY`: Required for chat functionality
- `HUME_API_KEY`: Required for voice features
- `HUME_SECRET_KEY`: Required for voice features
- `PORT`: Optional, defaults to 3002

### Frontend
- `NEXT_PUBLIC_BACKEND_URL`: URL of the backend server

## API Endpoints

### Chat
- `POST /api/chat`
  - Request: `{ userId, message, systemPromptMode }`
  - Response: `{ response, llmUsed, id }`

### Text-to-Speech (TTS)
- `POST /api/tts`
  - Request: `{ text }`
  - Response: `{ message, text, audioUrl }`

### Speech-to-Text (STT)
- `POST /api/stt`
  - Request: Form data with audio file
  - Response: `{ message, transcription }`

### Logs
- `GET /api/logs`
  - Response: Array of conversation logs

### Rate
- `POST /api/rate`
  - Request: `{ id, rating }`
  - Response: `{ message }`

## System Prompts

### Friendly Prompt
```
You are a friendly and helpful AI companion. Your goal is to be supportive, encouraging, and positive in your interactions. You should be empathetic and understanding, always trying to see things from the user's perspective. You should be patient and kind, even when the user is frustrated or confused. You should be enthusiastic and upbeat, bringing energy and positivity to the conversation. You should be respectful and considerate, treating the user with dignity and courtesy. You should be genuine and authentic, being honest and transparent in your responses.
```

### Challenging Prompt
```
You are a challenging and thought-provoking AI companion. Your goal is to push the user to think more deeply and critically about topics. You should ask probing questions that challenge assumptions and biases. You should present alternative perspectives and viewpoints to broaden the user's thinking. You should encourage the user to consider evidence and reasoning, not just opinions. You should be respectful but direct, not shying away from difficult topics. You should acknowledge the complexity of issues rather than oversimplifying. You should be intellectually honest, admitting when you don't know something or when there isn't a clear answer.
```

## LLM Integration
- OpenAI GPT-4o: Primary model for chat functionality

## Voice Features
- Text-to-Speech: Hume TTS for converting AI responses to speech
- Speech-to-Text: OpenAI Whisper for converting user speech to text

## Data Persistence
- Conversation logging: Store conversation history in a JSON file
- Rating system: Allow users to rate AI responses (thumbs up/down)

## Frontend Components

### Chat Interface
- ChatInterface: Main component for the chat page
- ChatInput: Component for text input and voice recording
- ChatMessage: Component for displaying chat messages
- ChatSettings: Component for system prompt selection

### Logs View
- LogsView: Component for displaying conversation history
- LogItem: Component for displaying individual log entries

## Deployment for Internal Testing
- Local deployment for quick testing
- Simple VPS or ngrok for shared access between cofounders

## Future Enhancements
- Multiple conversation threads
- More voice options
- Mobile app version
