# AI Voice Companion Codebase Overview

This document provides a comprehensive overview of the AI Voice Companion project codebase, its architecture, key components, and implementation details to help future developers understand and extend the application.

## Project Overview

The AI Voice Companion is a Next.js application that provides an AI assistant capable of:
- Real-time voice conversations using WebRTC
- Short audio clip processing
- Text-based interactions
- Retrieval-Augmented Generation (RAG) for context-aware responses
- Conversation history management
- User-specific conversations and settings

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
│   │   ├── admin/            # Admin panel and analytics
│   │   ├── api/              # API routes
│   │   ├── components/       # React components
│   │   ├── contexts/         # Context providers
│   │   ├── logs/             # Message logs interface
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
   - Supports both text and voice response modes
   - Resets/initializes new conversations when the user changes

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
   - Shows feedback status visually

5. **Navigation.tsx**
   - Provides navigation between app sections
   - Includes user selection dropdown
   - Responsive design for all screen sizes

6. **UserSelector.tsx**
   - Allows switching between different users
   - Maintains selected user across all pages
   - Persists selection in localStorage

### Context Providers

1. **UserContext.tsx**
   - Manages the current user state
   - Provides user information to all components
   - Handles user selection persistence
   - Makes user data available across the application

### Admin and Analytics

1. **Admin Dashboard**
   - Shows conversation statistics
   - Displays user activity metrics
   - Highlights the current user in tables
   - Links to RAG Analytics

2. **RAG Analytics**
   - Displays real message history from the current user
   - Shows basic stats about queries and responses
   - Designed to be extended with actual RAG monitoring

3. **Logs Page**
   - Filters messages by various criteria
   - Automatically filters by current user
   - Supports searching and date filtering

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
   - User management support

### API Routes

1. **Conversation API (`/api/conversation`)**
   - Creates and manages conversations
   - Retrieves conversation history
   - Associates conversations with specific users

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
   - Stores feedback in the database

7. **Logs API (`/api/logs`)**
   - Retrieves and filters message logs
   - Supports multiple filtering criteria
   - Returns messages with conversation metadata

8. **Users API (`/api/users`)**
   - Manages user operations
   - Creates and retrieves users
   - Gets individual user data

## Database Schema

The application uses Prisma with a PostgreSQL database. Key models include:

1. **User**
   - Represents an application user
   - Has a name and unique ID
   - Associated with multiple conversations

2. **Conversation**
   - Represents a chat session
   - Contains multiple messages
   - Associated with a specific user

3. **Message**
   - Individual messages in a conversation
   - Contains content, role (user/assistant)
   - Can have associated feedback

4. **MessageFeedback**
   - Stores user feedback on AI responses
   - Contains type (like/dislike)
   - Associated with a specific message

## User Management

The application supports multiple users with the following features:
- Three initial users (Connor, Raj, Mark) seeded in the database
- User selection via dropdown in the navigation bar
- Automatic filtering of logs and conversations by selected user
- Visual highlighting of current user in admin interface
- Conversation reset when user changes

## Conversation Modes

The application supports different interaction modes:

1. **Text Mode**
   - User types messages
   - AI responds with text only (no speech synthesis)
   - More suitable for reading longer responses

2. **Voice Mode**
   - User speaks or types messages
   - AI responds with both text and speech
   - Speech synthesis for AI responses

3. **Short Audio**
   - Records audio clips for processing
   - Transcribes and sends as messages

4. **Real-time Voice**
   - Streaming audio both ways
   - Low-latency conversation

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

## Recently Added Features

### Navigation and User Interface
- Added a navigation bar with links to Chat, Logs, and Admin
- Implemented a user selector in the navigation
- Made the interface responsive for all screen sizes
- Added persistent user selection across all pages

### User Management
- Created User model in database schema
- Implemented user switching functionality
- Associated conversations with specific users
- Added highlighting of current user in admin interface

### Message Feedback
- Added like/dislike buttons for AI messages
- Implemented feedback storage in database
- Added visual indicators for feedback status

### Admin Analytics
- Created basic dashboard with conversation statistics
- Added user activity monitoring
- Implemented RAG analytics with recent message display
- Highlighted current user data across all sections

## Planned Enhancements

### RAG Verification & Improvements
- Add monitoring of actual Pinecone operations
- Create debug view showing retrieved documents
- Implement personalization tracking
- Visualize context usage in conversations

### Real-Time Voice Enhancements
- Add live transcription display
- Show partial AI responses as they're generated
- Implement confidence scoring for speech recognition
- Provide visual indicators for context usage

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

Current focus areas include verifying that the RAG functionality is properly using Pinecone for context retrieval and enhancing the real-time voice interface to display transcriptions of the conversation. The user management system has been implemented to allow switching between different user contexts, with consistent filtering across all parts of the application. 