# Environment Variables Setup

This document explains how the environment variables are configured for the Next.js frontend application.

## File Structure

The application uses multiple environment files:

1. `.env` - Base values, safe to commit to git
2. `.env.local` - Contains secrets and sensitive information, not committed to git
3. `.env.development` - Settings specific to development mode (npm run dev)
4. `.env.production` - Settings specific to production mode (npm start)

## Key Changes from Express Backend

When migrating from Express to Next.js, the environment variables were reorganized:

1. Removed all `EXPO_PUBLIC_` prefixes and replaced with Next.js convention:
   - Public variables (accessible in browser) use `NEXT_PUBLIC_` prefix
   - Server-only variables have no prefix

2. Variable organization:
   - Database connection string: `DATABASE_URL`
   - Authentication: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
   - LLM providers: Separate keys for each provider (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc.)
   - Admin configuration: `FOUNDER_CLERK_IDS`
   - Email configuration: `SENDGRID_API_KEY`, `FROM_EMAIL`

## Running the Application

1. For local development:
   ```
   npm run dev
   ```
   This loads variables from `.env`, `.env.local`, and `.env.development`

2. For production:
   ```
   npm start
   ```
   This loads variables from `.env`, `.env.local`, and `.env.production`

## Deployment Configuration

When deploying to a platform like Vercel:

1. Configure all sensitive variables as environment variables in the Vercel project settings
2. Make sure to set `NODE_ENV=production`
3. Variables with `NEXT_PUBLIC_` prefix will be included in client bundles

## Variable Reference

| Variable | Description | Access | Location |
|----------|-------------|--------|----------|
| DATABASE_URL | Database connection string | Server-only | .env.local |
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | Clerk public key | Client & Server | .env.local |
| CLERK_SECRET_KEY | Clerk secret key | Server-only | .env.local |
| OPENAI_API_KEY | OpenAI API key | Server-only | .env.local |
| ANTHROPIC_API_KEY | Anthropic API key | Server-only | .env.local |
| GOOGLE_API_KEY | Google Gemini API key | Server-only | .env.local |
| DEEPSEEK_API_KEY | DeepSeek API key | Server-only | .env.local |
| FOUNDER_CLERK_IDS | Admin user IDs | Server-only | .env.local |
| SENDGRID_API_KEY | SendGrid API key | Server-only | .env.local |
| FROM_EMAIL | Email sender address | Server-only | .env.local |
| CHAT_LLM_MODEL | Default chat model | Server-only | .env |
| SUMMARIZATION_LLM_MODEL | Default summarization model | Server-only | .env |
| CORS_ALLOWED_ORIGINS | CORS configuration | Server-only | Varies |
| DEBUG_TOKEN_ESTIMATE | Enable token debugging | Server-only | Varies |
| TERMS_VERSION | Current terms version | Server-only | .env |