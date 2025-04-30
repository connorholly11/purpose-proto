# AI Companion App Frontend (Next.js)

This is the frontend application for the AI Companion project, built with Next.js.

## Features

- Chat interface with LLM integration
- Admin dashboard for system prompt management
- Evaluation tools for testing prompt performance
- User management and authentication with Clerk
- Voice transcription for audio input
- Email generation and sending
- Legal document handling

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```
   cd frontend
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Set up environment variables:
   ```
   cp .env.local.example .env.local
   ```
5. Edit `.env.local` with your configuration values
6. Generate Prisma client:
   ```
   npx prisma generate
   ```
7. Update Clerk imports (to ensure v5 compatibility):
   ```
   bash update-clerk-imports.sh
   ```
8. Start the development server:
   ```
   npm run dev
   ```

## Environment Variables

The application uses multiple environment files:

- `.env` - Base values, safe to commit
- `.env.local` - Local secrets and overrides (not committed to git)
- `.env.development` - Development-specific settings (loaded with npm run dev)
- `.env.production` - Production settings (loaded with npm start)

### Required Variables

At minimum, your `.env.local` should contain:

```
# Database
DATABASE_URL=postgresql://...

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
DEEPSEEK_API_KEY=...

# Admin Users
FOUNDER_CLERK_IDS=user_id1,user_id2
```

## API Structure

The application follows the Next.js App Router architecture. API routes are located in `src/app/api/` and are organized by feature:

- `/api/chat` - Chat with AI assistant
- `/api/admin/*` - Admin-only endpoints for system management
- `/api/eval/*` - Evaluation tools for prompt testing
- `/api/feedback` - User feedback submission
- `/api/legal/*` - Legal document retrieval and acceptance
- `/api/testing/*` - Automated testing endpoints
- `/api/voice/*` - Voice processing endpoints

## Authentication

Authentication is handled by Clerk. The application uses middleware to protect routes and verify user access. Admin-only routes are additionally protected by checking against a list of admin user IDs.

## Verification & Testing

Run the verification scripts to test API endpoints and clean up dependencies:

```
node scripts/verify-migration.js
node scripts/cleanup-dependencies.js
```

## Known Issues

- When upgrading to Clerk v5, all imports from `@clerk/nextjs` in API routes need to be changed to `@clerk/nextjs/server`. The update-clerk-imports.sh script helps automate this process.

## Deployment

To deploy the application:

1. Build the application:
   ```
   npm run build
   ```

2. Start the production server:
   ```
   npm start
   ```

For deployment on platforms like Vercel or AWS, follow their documentation for setting up environment variables.

## License

This project is licensed under the terms of the company's private license.

## Contributors

- Development Team @ Purpose