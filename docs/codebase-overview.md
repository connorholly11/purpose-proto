# AI Voice Companion Codebase Overview

This document provides a comprehensive overview of the AI Voice Companion project codebase, its architecture, key components, and implementation details to help future developers understand and extend the application.

## Project Overview

The AI Voice Companion is a Next.js application that provides an AI assistant capable of:
- Real-time voice conversations using WebRTC
- Short audio clip processing
- Text-based interactions
- Retrieval-Augmented Generation (RAG) for context-aware responses
- Conversation history management

## Project Structure

The project follows a structured approach with clear separation of concerns:

```
purpose-proto/
├── __tests__/                # Testing directory
│   └── unit/                 # Unit tests
├── docs/                     # Documentation
├── prisma/                   # Database schema
├── public/                   # Static files
├── scripts/                  # Utility scripts (e.g., document ingestion)
├── src/
│   ├── app/                  # Next.js app directory
│   │   ├── api/              # API routes
│   │   ├── components/       # React components
│   │   └── page.tsx          # Main page
│   ├── lib/                  # Library code
│   │   └── services/         # Service modules
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Utility functions
├── jest.config.js            # Jest configuration
├── jest.setup.js             # Jest setup file
├── package.json              # Dependencies
└── README.md                 # Project documentation
```

## Key Components

### Frontend Components

1. **ChatInterface.tsx**
   - Main chat interface component
   - Manages messages, conversation state
   - Handles user input (text and audio)
   - Communicates with backend API

2. **AudioRecorder.tsx**
   - Handles short audio clip recording
   - Uses MediaRecorder API
   - Processes audio files for transcription

3. **RealtimeVoice.tsx**
   - Implements real-time voice streaming
   - Uses WebRTC for low-latency audio
   - Integrates with OpenAI's real-time API

4. **Message.tsx**
   - Renders individual chat messages
   - Handles like/dislike feedback functionality
   - Differentiates between user and AI messages

### Backend Services

1. **OpenAI Service (`src/lib/services/openai.ts`)**
   - Manages communication with OpenAI APIs
   - Handles API key authentication
   - Provides functions for:
     - Text embeddings generation
     - Chat completions
     - Audio transcription
     - Text-to-speech conversion

2. **Pinecone Service (`src/lib/services/pinecone.ts`)**
   - Manages vector database operations
   - Handles document retrieval for RAG
   - Provides upsert and query functionality

3. **Prisma Service (`src/lib/services/prisma.ts`)**
   - Database connection management
   - CRUD operations for conversations and messages
   - User management (planned)

### API Routes

1. **Conversation API (`/api/conversation`)**
   - Creates and manages conversations
   - Retrieves conversation history

2. **RAG API (`/api/rag`)**
   - Processes user queries
   - Retrieves relevant context from Pinecone
   - Generates AI responses with context

3. **Transcribe API (`/api/transcribe`)**
   - Converts audio to text using OpenAI Whisper

4. **TTS API (`/api/tts`)**
   - Converts text to speech using OpenAI TTS

5. **Real-time Session API (`/api/rt-session`)**
   - Manages WebRTC sessions
   - Provides ephemeral tokens for real-time communication

6. **Message Feedback API (`/api/message/[messageId]/feedback`)**
   - Handles like/dislike feedback on messages

## Database Schema

The application uses Prisma with a PostgreSQL database. Key models include:

1. **Conversation**
   - Represents a chat session
   - Contains multiple messages
   - Will be associated with a user

2. **Message**
   - Individual messages in a conversation
   - Contains content, role (user/assistant), and timestamps
   - Can have associated feedback

3. **MessageFeedback**
   - Stores user feedback on AI responses
   - Contains type (like/dislike)

## Authentication and User Management

User authentication and management is planned but not yet implemented. The system will support three initial users (Connor, Raj, Mark) with plans to associate conversations and logs with specific users.

## Testing Infrastructure

The project uses Jest for testing with the following structure:

1. **Unit Tests**
   - Tests for individual components and services
   - Mocks external dependencies
   - Coverage for key functionality

2. **Test Configuration**
   - Jest is configured for Next.js
   - Testing utilities are setup in `jest.setup.js`

## RAG Implementation

The Retrieval-Augmented Generation system works as follows:

1. **Document Ingestion**
   - Documents are processed using `scripts/ingest.ts`
   - Text is chunked, embedded, and stored in Pinecone

2. **Query Processing**
   - User queries are embedded using the same model
   - Similar vectors are retrieved from Pinecone
   - Retrieved context is sent to OpenAI with the query

3. **Response Generation**
   - OpenAI generates a response using the provided context
   - Response is returned to the user with the option for speech synthesis

## Real-time Voice Implementation

The real-time voice feature uses WebRTC and OpenAI's streaming API:

1. **Audio Capture**
   - Browser's getUserMedia API captures microphone input
   - Voice Activity Detection identifies when user is speaking

2. **Audio Streaming**
   - Audio is compressed and streamed to OpenAI in real-time
   - Audio input is processed by GPT-4o model

3. **Response Streaming**
   - AI responses are streamed back in real-time
   - Responses are displayed and optionally spoken using TTS

## Planned Enhancements

As detailed in the todo.md file, the following enhancements are planned:

1. **Navigation & Layout**
   - Navigation bar with links to Chat, Logs, and Admin

2. **Admin Panel**
   - Analytics dashboard
   - Conversation statistics
   - User activity metrics
   - RAG/embedding monitoring

3. **Logs Page**
   - View and filter all chat messages
   - Search functionality

4. **User Implementation**
   - User model and authentication
   - Three initial users (Connor, Raj, Mark)

5. **Chat Interface Enhancements**
   - Toggle between Text and Voice modes
   - Persistent mode selection

## Development Guidelines

When extending this application, please follow these guidelines:

1. **Code Organization**
   - Keep components focused on single responsibilities
   - Use services for business logic
   - Keep API routes thin, delegating to service functions

2. **Testing**
   - Write tests for new functionality
   - Maintain existing test coverage
   - Use mocks for external dependencies

3. **Error Handling**
   - Implement proper error handling for all async operations
   - Provide user-friendly error messages
   - Log errors for debugging

4. **Performance**
   - Optimize for real-time interactions
   - Use streaming responses where appropriate
   - Minimize client-side processing

5. **Accessibility**
   - Ensure UI components are accessible
   - Provide alternative interaction methods
   - Follow WCAG guidelines

## Key Dependencies

- **Next.js**: React framework for the frontend and API routes
- **OpenAI**: AI models for conversations, embeddings, and speech
- **Pinecone**: Vector database for RAG implementation
- **Prisma**: ORM for database operations
- **React**: UI library
- **TailwindCSS**: Utility-first CSS framework
- **Jest**: Testing framework

## Environment Variables

The application requires several environment variables to function correctly:

```
# OpenAI
OPENAI_API_KEY=your_openai_api_key
EMBEDDING_MODEL=text-embedding-3-small

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_HOST=your_pinecone_host
PINECONE_INDEX=your_pinecone_index

# Database
DATABASE_URL=your_database_connection_string
```

## Conclusion

This AI Voice Companion application provides a solid foundation for an AI assistant with multiple interaction methods. The code is structured to be maintainable and extensible, with clear separation of concerns between components, services, and API routes.

Future developers should focus on implementing the planned enhancements while maintaining the existing architecture and code quality standards. The test infrastructure provides a safety net for changes, and the documentation should be kept up-to-date as the application evolves. 