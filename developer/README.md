# Purpose AI - Backend to Next.js Migration

This project aims to migrate a standalone Express backend to be integrated into the Next.js frontend application.

## Progress Summary

We've made significant progress in migrating the backend functionality to the Next.js application:

### Completed
- Created core library modules in `frontend/src/lib/` that replicate backend service functionality:
  - `prisma.ts`: Prisma client singleton utility
  - `llm.ts`: Multi-model LLM API integrations (OpenAI, Anthropic, DeepSeek, Gemini)
  - `memory.ts`: User context and conversation management
  - `prompts.ts`: System prompt management
  - `email.ts`: Email generation and delivery
  - `transcription.ts`: Audio transcription services
  - `testing.ts`: Testing utilities
  - `evaluation.ts`: LLM conversation evaluation system

- Implemented middleware:
  - Authentication via Clerk
  - Terms acceptance checks
  - Admin authorization checks
  - User synchronization

- Implemented API routes:
  - Chat: `/api/chat` - Core chat functionality

### In Progress / To Do
- Remaining API routes need to be implemented (admin, email, eval, feedback, legal, testing, voice)
- Environment variables need to be consolidated
- Frontend refactoring: Update components to use the new API routes
- Prisma schema needs to be copied and regenerated
- Testing and verification

## Next Steps

1. Implement the remaining API routes, starting with the most critical ones (legal, feedback)
2. Move Prisma schema and run `prisma generate`
3. Refactor frontend components to use the new API structure
4. Verify and test all functionality

For detailed progress tracking, see the `todo.md` file in the project root.

## Architecture

The migrated system follows Next.js API routes pattern:
- `/src/lib/` contains service logic
- `/src/app/api/` contains API route handlers
- Authentication is handled by Clerk Next.js middleware
- Database access via Prisma client singleton

## Getting Started

1. Copy environment variables:
   ```bash
   cp backend/.env frontend/.env.local
   ```
   Update variables in `.env.local` to ensure client-side variables use the `NEXT_PUBLIC_` prefix.

2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Run the application:
   ```bash
   npm run dev
   ```

4. Test the API routes:
   ```bash
   curl -X POST http://localhost:3000/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello world"}'
   ```