# AI Voice Companion

An advanced AI Voice Companion that supports both short audio clips and real-time streaming voice conversations with GPT-4o, enhanced with Retrieval-Augmented Generation (RAG) capabilities.

## Features

- **Short Audio Mode**: Record short audio clips, get them transcribed, processed with RAG, and receive spoken responses.
- **Real-Time Voice Streaming**: Have natural, low-latency voice conversations with GPT-4o using WebRTC.
- **RAG Integration**: Access external knowledge through Pinecone vector database.
- **Conversation History**: Store and retrieve conversation history.
- **Multiple Voice Options**: Choose from different OpenAI voices for the AI responses.

## Technology Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Vector Database**: Pinecone
- **AI Services**: OpenAI (GPT-4o, Whisper, TTS, Embeddings)
- **Real-time Communication**: WebRTC

## Getting Started

### Prerequisites

- Node.js 18+ installed
- An OpenAI API key with access to GPT-4o, Whisper, TTS, and Embeddings
- A Pinecone account and index
- A PostgreSQL database (we use Supabase)

### Environment Setup

Create a `.env.local` file with the following variables:

```
# URL of the backend server that the frontend will call
BACKEND_URL=http://localhost:3000

# Application name for display purposes
APP_NAME="AI Companion"

# The port the backend server will run on
PORT=3000

# Database connection string
DATABASE_URL="your-postgresql-connection-string"

# OpenAI API key
OPENAI_API_KEY=your-openai-api-key
EMBEDDING_MODEL=text-embedding-3-small

# Pinecone configuration
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_HOST=your-pinecone-host
PINECONE_INDEX=your-pinecone-index-name
```

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Setup the database:
   ```bash
   npx prisma db push
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Document Ingestion for RAG

To add documents to the Pinecone vector database for RAG:

1. Place your documents in a directory (e.g., `docs/`)
2. Run the ingestion script:
   ```bash
   npm run ingest
   ```
3. When prompted, enter the path to your documents directory

The script supports .md, .txt, and .json files.

## Usage

1. Open the application in your browser at `http://localhost:3000`
2. Use the interface to:
   - Type a message and get a response
   - Click the "Short Audio" button to record a short audio clip
   - Click the "Realtime Voice" button to start a streaming conversation

## Architecture

- **API Endpoints**:
  - `/api/transcribe`: Convert audio to text using Whisper
  - `/api/tts`: Convert text to speech
  - `/api/rag`: Process queries with Retrieval-Augmented Generation
  - `/api/rt-session`: Generate ephemeral tokens for realtime WebRTC streaming
  - `/api/conversation`: Manage conversation history

- **Services**:
  - `openai.ts`: Handle OpenAI API calls
  - `pinecone.ts`: Manage vector database operations
  - `prisma.ts`: Database access and operations

- **Components**:
  - `AudioRecorder.tsx`: Record and process short audio clips
  - `RealtimeVoice.tsx`: WebRTC-based real-time voice conversations
  - `ChatInterface.tsx`: The main chat interface

## License

MIT
