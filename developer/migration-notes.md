# Backend to Next.js Migration Notes

This document provides a detailed overview of the migration process from the Express backend to Next.js API routes.

## Migration Strategy

Our migration approach was to:

1. Duplicate all backend functionality into Next.js API routes
2. Keep the same database schema and models
3. Restructure service logic to work within the Next.js serverless paradigm
4. Update frontend components to use the new API endpoints
5. Verify functionality before removing the Express backend

## Key Changes

### Authentication

- Replaced `@clerk/clerk-sdk-node` with `@clerk/nextjs`
- Implemented Clerk middleware in `src/middleware.ts` to protect routes
- Added authorization checks for admin routes
- Implemented terms acceptance checking

### API Routes

We organized API routes by feature and recreated the Express routes as Next.js API route handlers:

| Express Endpoint | Next.js Endpoint |
|-----------------|------------------|
| `/api/chat` | `/api/chat` |
| `/api/admin/*` | `/api/admin/*` |
| `/api/eval/*` | `/api/eval/*` |
| `/api/feedback` | `/api/feedback` |
| `/api/legal/*` | `/api/legal/*` |
| `/api/testing/*` | `/api/testing/*` |
| `/api/voice/*` | `/api/voice/*` |

### Service Logic

We migrated service files from `backend/src/services/` to `frontend/src/lib/`:

- `llmService.ts` → `lib/llm.ts`
- `memoryService.ts` → `lib/memory.ts`
- `promptService.ts` → `lib/prompts.ts`
- `emailService.ts` → `lib/email.ts`
- `transcriptionService.ts` → `lib/transcription.ts`
- `testingService.ts` → `lib/testing.ts`
- `evalService.ts` → `lib/evaluation.ts`

### Frontend Changes

- Updated the frontend API services to use Next.js-compatible data fetching
- Replaced `useApi` hook with direct fetch calls using Clerk auth
- Created a proper Next.js app directory structure
- Added environment variables with proper `NEXT_PUBLIC_` prefixes

### Database Handling

- Moved Prisma schema to the frontend
- Created a Prisma client utility in Next.js
- Maintained the same database models

## Testing Notes

The following areas need thorough testing:

1. Chat functionality with LLM integration
2. Admin features (prompt management, user management)
3. Evaluation tools
4. Email generation and sending
5. Voice transcription
6. Authentication flows
7. Terms acceptance process

## Remaining Tasks

See the `todo.md` file for a detailed checklist of remaining tasks.

## Deployment Considerations

1. Environment Variables: Ensure all environment variables are properly configured in your production environment
2. Database Migration: The same database can be used by the Next.js app
3. Authentication: Make sure Clerk is properly configured for production
4. API Routes: Verify that all API routes are working in the production environment

## Rollback Plan

If issues are encountered with the Next.js migration, we can temporarily revert to the Express backend by:

1. Rolling back frontend code to use the original API endpoints
2. Ensuring the Express backend is still operational

## Future Improvements

- Consider using React Server Components for better performance
- Implement more Next.js features like ISR (Incremental Static Regeneration) for specific pages
- Consider using Next.js middleware for more advanced request handling