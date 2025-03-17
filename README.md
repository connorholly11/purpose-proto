# AI Companion

A modern AI chat application with text and voice capabilities, powered by OpenAI's GPT-4o model and Hume's voice services.

## Project Overview

This project consists of two main components:

1. **Backend Server**: A Node.js/Express server that handles API requests, integrates with OpenAI and Hume, and manages conversation logs.
2. **Frontend Application**: A Next.js application that provides a user-friendly interface for interacting with the AI companion.

## Features

- Chat interface with text input and message history
- Voice input using speech-to-text (OpenAI Whisper)
- Voice output using text-to-speech (Hume TTS)
- System prompt selection (friendly vs. challenging)
- Conversation history with rating functionality
- Error handling for network issues and timeouts

## Requirements

- Node.js 18+
- npm or yarn
- OpenAI API key
- Hume API key and Secret key

## Setup Instructions

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
OPENAI_API_KEY=your_openai_api_key
HUME_API_KEY=your_hume_api_key
HUME_SECRET_KEY=your_hume_secret_key
```

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd my-companion-backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

The backend server will run on http://localhost:3002 by default.

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd my-companion-frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file with:
   ```
   NEXT_PUBLIC_BACKEND_URL=http://localhost:3002
   ```

4. Start the development server:
   ```
   npm run dev
   ```

The frontend application will run on http://localhost:3000.

## Project Structure

- `/my-companion-backend`: Backend server code
- `/my-companion-frontend`: Frontend application code
- `/plan.md`: Project planning document
- `/todo.md`: Task tracking document

## Deployment

See the README files in the backend and frontend directories for specific deployment instructions.

## License

MIT
