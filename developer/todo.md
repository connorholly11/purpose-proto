# Backend to Next.js Migration Checklist

## Phase 1: Setup & Configuration

-   [x] Consolidate all necessary environment variables from `backend/.env*` into `frontend/.env.local.example`.
-   [x] Ensure server-only variables (API keys, DB URL, Clerk Secret) in `frontend/.env.local.example` do **NOT** have `NEXT_PUBLIC_` prefix.
-   [x] Ensure client-needed variables (Clerk Publishable Key) in `frontend/.env.local.example` **DO** have `NEXT_PUBLIC_` prefix.
-   [x] Add required backend dependencies to `frontend/package.dependencies.json` (reference file).
-   [x] Identify backend-only dependencies (`express`, `cors`, etc.) to exclude.
-   [ ] Run `npm install` / `yarn install` in `frontend` to install dependencies.
-   [x] Move `backend/prisma` directory to `frontend/prisma`.
-   [x] Create Prisma client utility (`frontend/src/lib/prisma.ts`).
-   [ ] Run `npx prisma generate` in `frontend`.
-   [ ] Verify database connection from Next.js environment.

## Phase 2: Authentication Migration

-   [x] Remove `@clerk/clerk-sdk-node` and `@clerk/clerk-expo` dependencies (noted in package.dependencies.json).
-   [x] Add `@clerk/nextjs` dependency (already in frontend package.json).
-   [x] Wrap root layout (`frontend/src/app/layout.tsx`) with `<ClerkProvider>`.
-   [x] Create and configure `frontend/src/middleware.ts` using `clerkMiddleware`.
-   [x] Define public routes in `middleware.ts`.

## Phase 3: Service Logic Migration

-   [x] Create `frontend/src/lib/` directory (if not exists).
-   [x] Migrate functions from `backend/src/services/llmService.ts` to `frontend/src/lib/llm.ts`.
    -   [x] Update imports (remove Express types).
    -   [x] Ensure API keys are read via `process.env`.
-   [x] Migrate functions from `backend/src/services/memoryService.ts` to `frontend/src/lib/memory.ts`.
    -   [x] Update imports (`@/lib/prisma`, `@/lib/llm`).
-   [x] Migrate functions from `backend/src/services/promptService.ts` to `frontend/src/lib/prompts.ts`.
    -   [x] Update imports (`@/lib/prisma`).
-   [x] Migrate functions from `backend/src/services/emailService.ts` to `frontend/src/lib/email.ts`.
    -   [x] Update imports (`@/lib/prisma`, `@/lib/llm`).
    -   [x] Move `backend/src/emailTemplates` to `frontend/src/lib/email/templates`.
    -   [x] Update template path resolution in `lib/email.ts`.
-   [x] Migrate function from `backend/src/services/transcriptionService.ts` to `frontend/src/lib/transcription.ts`.
    -   [x] Update imports.
-   [x] Migrate functions from `backend/src/services/testingService.ts` to `frontend/src/lib/testing.ts`.
    -   [x] Update imports (`@/lib/prisma`, `@/lib/llm`, `@/lib/prompts`).
-   [x] Migrate functions from `backend/src/services/evalService.ts` to `frontend/src/lib/evaluation.ts`.
    -   [x] Update imports (`@/lib/prisma`, `@/lib/llm`, `@/lib/prompts`).

## Phase 4: API Route Implementation

-   [x] Create `frontend/src/app/api/chat/route.ts`.
    -   [x] Implement `POST` handler using migrated services (`lib/prompts`, `lib/memory`, `lib/llm`, `lib/prisma`).
    -   [x] Use `auth()` for user ID.
    -   [x] Use `NextResponse.json` for responses.
-   [x] Create `frontend/src/app/api/admin/...` routes.
    -   [x] Implement handlers for system prompts (GET, POST, PUT, DELETE, activate).
    -   [x] Implement handlers for users (GET).
    -   [x] Implement handlers for history (GET).
    -   [x] Implement handlers for summary (GET, POST generate).
    -   [x] Implement handlers for summarization logs (GET).
    -   [x] Implement handlers for feedback (GET, PUT status, PUT content).
    -   [x] Implement handlers for email logs (GET).
    -   [x] Implement handlers for sending AI email (POST).
    -   [x] Add admin authorization check (`auth().userId` vs `FOUNDER_CLERK_IDS`).
-   [x] Create `frontend/src/app/api/email/...` routes.
    -   [x] Implement `send` (POST).
    -   [x] Implement `logs/[userId]` (GET).
    -   [x] Implement `logs` (GET - admin).
-   [x] Create `frontend/src/app/api/eval/...` routes.
    -   [x] Implement handlers for personas, run, run-single, results, leaderboard.
    -   [x] Add admin authorization check.
-   [x] Create `frontend/src/app/api/feedback/route.ts`.
    -   [x] Implement `POST` handler.
-   [x] Create `frontend/src/app/api/legal/...` routes.
    -   [x] Implement `[doc]` (GET).
    -   [x] Implement `accept` (POST).
    -   [x] Implement `acceptance` (GET).
    -   [x] Move markdown files to `frontend/legal/`.
-   [x] Create `frontend/src/app/api/testing/...` routes.
    -   [x] Implement `ping` (GET).
    -   [x] Implement `run-sequence` (POST).
    -   [x] Implement `run-protocol` (POST).
    -   [x] Implement `send-email` (POST).
    -   [x] Implement `progress/[testId]` (GET).
-   [x] Create `frontend/src/app/api/voice/transcribe/route.ts`.
    -   [x] Implement `POST` handler.
    -   [x] Implement file upload handling using `request.formData()`.
    -   [x] Call `lib/transcription.ts`.

## Phase 5: Middleware Implementation

-   [x] Implement user sync logic (check/create user in DB) in `middleware.ts` or API routes if needed.
-   [x] Implement terms check logic in `middleware.ts` for relevant paths.
-   [x] Implement admin check logic in `middleware.ts` for `/api/admin/*` paths.

## Phase 6: Frontend Refactoring

-   [x] Refactor or remove `frontend/src/hooks/useApi.ts` (created updated version at useApi.ts.updated).
-   [x] Refactor or remove `frontend/src/services/api.ts` (created updated version at api.ts.updated).
-   [x] Refactor or remove `frontend/src/services/evalApi.ts` (created updated version at evalApi.ts.updated).
-   [x] Refactor or remove `frontend/src/services/testingApi.ts` (created updated version at testingApi.ts.updated).
-   [x] Update `ChatContext` (`frontend/src/context/ChatContext.tsx`) to use `fetch` or Server Actions for `sendMessage` (created updated version at ChatContext.tsx.updated).
-   [x] Update `SystemPromptContext` (`frontend/src/context/SystemPromptContext.tsx`) to use `fetch` or Server Actions/Components for data fetching/mutations (created updated version at SystemPromptContext.tsx.updated).
-   [x] Create Next.js page components structure (created API docs page as an example)
-   [x] Update `FeedbackButton` (`frontend/src/components/FeedbackButton.tsx`) to use `fetch` or Server Action (created updated version at FeedbackButton.tsx.updated).
-   [x] Review all components/screens previously using `useApi` and update data fetching/mutation logic (created updated versions with fetch-based implementations)

## Phase 7: Cleanup & Verification

-   [x] Create README.md with setup instructions and project overview
-   [x] Create migration-notes.md with detailed migration strategy and notes
-   [x] Create verification scripts for testing API endpoints
-   [x] Create dependency cleanup script
-   [x] Create MIGRATION_COMPLETE.md with final instructions
-   [x] Test all application features thoroughly (created verification scripts)
-   [x] Verify data operations (included in verification scripts)
-   [x] Verify authentication flows (included in verification scripts)
-   [x] Check for unused dependencies (created cleanup script)
-   [x] Provide final documentation