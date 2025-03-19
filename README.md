# AI Companion with Voice & Text RAG

A full-stack AI companion application with text and voice chat capabilities, enhanced with Retrieval-Augmented Generation (RAG) for improved contextual responses.

## Features

- **Text & Voice Chat**: Interact with GPT-4 via text or voice
- **Retrieval-Augmented Generation (RAG)**: Enhance responses with relevant context from a Pinecone vector database
- **OpenAI Integration**: Uses GPT-4, Whisper (STT), TTS, and embeddings
- **Real-time Audio**: Process voice input and generate voice output
- **Persistent Conversations**: Store and retrieve conversation history

## Project Structure

This is a monorepo with two main components:

### Backend (`/backend`)

Node.js/Express server with:
- OpenAI integration for LLM, STT, TTS, and embeddings
- Pinecone for vector database storage
- Prisma ORM with Supabase (PostgreSQL) for data persistence
- Robust error handling and logging

### Frontend (`/frontend`)

Next.js application with:
- Modern, responsive UI built with TailwindCSS
- Text chat interface
- Voice recording and playback
- Conversation management
- TypeScript for type safety

## Current Status

The project is in active development. Current status:

- ✅ Backend services and API routes implemented
- ✅ Frontend UI components created  
- ✅ Database schema and migrations set up
- ✅ Environment configuration and error handling
- ❌ API key authentication issue with OpenAI (needs fixing)
- ❌ Vector database seeding pending completion
- ❌ Frontend-backend integration pending
- ❌ Deployment configuration pending

See [TO-DO.md](./TO-DO.md) for the current implementation checklist.

## Getting Started

### Prerequisites

- Node.js (v14+)
- PostgreSQL database (via Supabase)
- OpenAI API key
- Pinecone API key

### Installation & Setup

1. Clone the repository
2. Configure the environment variables:
   - Copy `.env.example` to `.env` and fill in your API keys and database credentials

3. Backend setup:
   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma db push
   npm run dev
   ```

4. Frontend setup:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. Open your browser to http://localhost:3000

## Testing the Backend

You can test the backend health endpoint:

```bash
curl http://localhost:3003/health
```

## Deployment

### Backend (Heroku)

1. Create a Heroku app
2. Set environment variables in Heroku's config vars
3. Deploy the backend directory

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy the frontend directory

## License

This project is licensed under the MIT License - see the LICENSE file for details. 