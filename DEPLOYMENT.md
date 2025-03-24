# Deployment Guide

This guide provides instructions for deploying the AI Companion app and resolving common production issues.

## Quick Fix for 500 Errors

If you're experiencing 500 errors on `/api/users`, `/api/system-prompts`, or memory loading issues, follow these steps:

1. **Verify environment variables**:
   ```bash
   npm run verify-env
   ```

2. **Run database migrations**:
   ```bash
   npm run db:migrations
   ```

3. **Fix database extensions and tables**:
   ```bash
   npm run db:fix
   ```

## Environment Variables

Ensure these variables are properly set in your production environment:

```
# Required variables
DATABASE_URL="postgresql://user:password@host:5432/dbname"
OPENAI_API_KEY=sk-...
EMBEDDING_MODEL=text-embedding-3-small
PINECONE_API_KEY=pcsk_...
PINECONE_HOST=https://your-index.svc.your-id.pinecone.io
PINECONE_INDEX=your-index-name

# Optional but recommended
ADMIN_SECRET_KEY=your-secure-admin-key  # For /api/admin/* routes
```

## Database Setup

### 1. Create the Required Extension

The application relies on the `uuid-ossp` PostgreSQL extension. If your database user doesn't have permission to create extensions, connect as a superuser and run:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 2. Run Migrations

Deploy Prisma migrations to ensure your database schema is up-to-date:

```bash
npm run db:migrations
```

### 3. Verify Database Setup

Run the DB fix endpoint to check and fix database issues:

```bash
curl -X POST https://your-app-url/api/admin/db-fix -H "x-admin-key: YOUR_ADMIN_SECRET_KEY"
```

This endpoint will:
- Verify the `uuid-ossp` extension is installed
- Check that all required tables exist
- Add any missing columns (like `lastSummarizedAt` in the `Conversation` table)
- Run test queries to ensure tables are correctly configured

## Troubleshooting

### 1. "relation does not exist" Errors

This usually means the database migrations haven't been run. Execute:

```bash
npm run db:migrations
```

### 2. "function uuid_generate_v4() does not exist" Errors

The `uuid-ossp` extension is missing. Have a database admin run:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 3. Conversation Memory Not Loading

If memory isn't loading but other features work:

1. Check if the `ConversationSummary` table exists:
   ```bash
   npm run db:fix
   ```

2. Verify the `lastSummarizedAt` column exists in `Conversation` table.

### 4. Database Connection Issues

If you see "Failed to connect to database" errors:

1. Verify your `DATABASE_URL` is correct
2. Check that the database server allows connections from your deployment host
3. Ensure database credentials are valid

## Monitoring Logs

The application uses structured logging for debugging. Check your platform's logs for entries containing:

- `Prisma` - Database connection and query issues
- `MemoryService` - Memory generation and retrieval issues
- `Users API`, `SystemPrompts API` - API endpoint errors
- `db-fix` - Database setup and fix issues

## Build and Deployment Process

For a successful deployment:

1. **Build the application**:
   ```bash
   npm run build
   ```
   This runs Prisma generation and environment verification.

2. **Deploy migrations**:
   ```bash
   npm run db:migrations
   ```
   
3. **Fix database setup**:
   ```bash
   npm run db:fix
   ```

4. **Start the application**:
   ```bash
   npm run start
   ```

## Platform-Specific Guidelines

### Vercel

1. Add all environment variables in the Vercel dashboard
2. Add a build command that runs migrations: `prisma generate && prisma migrate deploy && next build`

### Railway

1. Add environment variables in the Railway dashboard
2. Configure the database connection URL in the RAILWAY_STATIC_URL format
3. Add a build command: `npm run build && npm run db:migrations`

### Docker

If deploying with Docker, ensure the `DATABASE_URL` is accessible from within the container network and run migrations before starting the application. 