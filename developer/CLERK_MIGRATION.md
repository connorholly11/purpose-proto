# Clerk v5 Migration Guide

This guide explains the changes needed to migrate from Clerk v4 to v5 in the Next.js application.

## Overview

Clerk v5 has made significant changes to their package structure. Most importantly:

1. Server-side Clerk helpers have moved to the `/server` subpath
2. Some API methods and function names have changed

## Required Changes

### 1. Middleware Update

The most important change is in `src/middleware.ts`:

* Replace `authMiddleware` with `clerkMiddleware` 
* Change all server-side imports to come from `@clerk/nextjs/server` instead of `@clerk/nextjs`
* Restructure the middleware to use the new API structure

Before:
```typescript
import { authMiddleware, clerkClient } from '@clerk/nextjs';

export default authMiddleware({
  afterAuth: (auth, req, evt) => {
    // Code here
  },
  // Other options
});
```

After:
```typescript
import { clerkMiddleware, clerkClient, createRouteMatcher } from '@clerk/nextjs/server';

export default clerkMiddleware(async (auth, req) => {
  // Code here
  const { userId } = await auth();
  // Rest of your logic
});
```

### 2. API Route Updates

For all API routes in `src/app/api/`, update imports:

```typescript
// Before
import { auth } from '@clerk/nextjs';

// After
import { auth } from '@clerk/nextjs/server';
```

### 3. Automation Script

We've provided a script to help automate these changes:

```bash
bash update-clerk-imports.sh
```

This script will:
1. Find all TypeScript files in the API routes directory
2. Replace imports from `@clerk/nextjs` with `@clerk/nextjs/server`
3. Remove backup files

### 4. Client Components

No changes are needed for client components that use Clerk. Components can continue to import from `@clerk/nextjs`:

```typescript
import { SignIn, useAuth } from '@clerk/nextjs';
```

## Testing Changes

After making these changes:

1. Run `npm run dev` to start the development server
2. Check the console for any Clerk-related errors
3. Test authentication flows to ensure they work correctly

## References

- [Clerk v5 Migration Guide](https://clerk.com/docs/upgrading/v5)
- [Clerk Next.js Documentation](https://clerk.com/docs/quickstarts/nextjs)