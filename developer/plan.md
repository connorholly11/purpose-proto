Okay, let's create a detailed migration plan and a corresponding `todo.md` checklist to guide the process of consolidating your Express backend functionality into your existing Next.js frontend application.

**Assumption:** Your `frontend` directory is indeed a Next.js application, likely using the App Router (`src/app/`) or Pages Router (`src/pages/`). We will assume the App Router for path examples, but the principles are similar for the Pages Router.

---

## Backend-to-Next.js Migration Plan

This plan outlines the steps to migrate the logic and functionality from the `backend` directory into the `frontend` Next.js application.

**Phase 1: Setup and Configuration**

1.  **Environment Variables:**
    *   **Action:** Consolidate environment variables from `backend/.env`, `backend/.env.development`, etc., into `frontend/.env.local`.
    *   **Details:**
        *   Copy all variables (e.g., `DATABASE_URL`, `CLERK_SECRET_KEY`, `LLM_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `DEEPSEEK_API_KEY`, `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `FOUNDER_CLERK_IDS`, `DEFAULT_SYSTEM_PROMPT_ID`).
        *   **Crucially:** Variables needed *only* on the server-side (like API keys, DB URL, Clerk Secret) should **NOT** have the `NEXT_PUBLIC_` prefix.
        *   Variables needed in the browser (like `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`) **MUST** have the `NEXT_PUBLIC_` prefix (rename `EXPO_PUBLIC_` to `NEXT_PUBLIC_`).
        *   Remove `PORT` and `CORS_ALLOWED_ORIGINS` as Next.js hosting platforms handle this differently.
    *   **File:** `frontend/.env.local`

2.  **Dependencies:**
    *   **Action:** Add backend dependencies to the frontend's `package.json`.
    *   **Details:** Review `backend/package.json` and add necessary dependencies (e.g., `@prisma/client`, `@clerk/nextjs` (replacing backend/frontend versions), `@sendgrid/mail`, `@google/genai`, `openai`, `handlebars`, `multer`) to `frontend/package.json`. Remove backend-specific dependencies like `express`, `cors`, `morgan`, `@clerk/clerk-sdk-node`.
    *   **File:** `frontend/package.json`
    *   **Command:** Run `npm install` or `yarn install` in the `frontend` directory.

3.  **Prisma Integration:**
    *   **Action:** Move Prisma setup into the Next.js project.
    *   **Details:**
        *   Move the entire `backend/prisma` directory to `frontend/prisma`.
        *   Ensure `DATABASE_URL` in `frontend/.env.local` points to the correct database.
        *   Create a Prisma client instance utility file (e.g., `frontend/src/lib/prisma.ts`) to ensure a single instance is used in development.
        *   Run `npx prisma generate` within the `frontend` directory.
    *   **Files:** `frontend/prisma/`, `frontend/src/lib/prisma.ts` (new)

**Phase 2: Authentication Migration**

1.  **Clerk Setup:**
    *   **Action:** Configure Clerk for Next.js.
    *   **Details:**
        *   Remove `@clerk/clerk-sdk-node` from backend deps and `@clerk/clerk-expo` from frontend deps. Add `@clerk/nextjs`.
        *   Wrap the root layout (`frontend/src/app/layout.tsx`) with `<ClerkProvider>`.
        *   Create a middleware file (`frontend/src/middleware.ts`) and use `clerkMiddleware` to protect routes. Define public routes (like `/sign-in`, `/api/legal/*`, `/health`).
    *   **Files:** `frontend/src/app/layout.tsx`, `frontend/src/middleware.ts` (new)

2.  **Replace Auth Middleware Logic:**
    *   **Action:** Remove custom Express auth middleware and rely on Clerk's Next.js integration.
    *   **Details:** The `backend/src/middleware/authMiddleware.ts` is no longer needed. Accessing authenticated user info in API routes will use Clerk's `auth()` helper.
    *   **Files to Remove/Ignore:** `backend/src/middleware/authMiddleware.ts`

**Phase 3: Service Logic Migration**

1.  **LLM Service:**
    *   **Action:** Move LLM API call functions to a Next.js utility module.
    *   **Details:** Move functions like `callLlmApi`, `callSummarizationLlmApi`, `callOpenAiApi`, `callAnthropicApi`, etc., from `backend/src/services/llmService.ts` to `frontend/src/lib/llm.ts`. Remove Express-specific code. Ensure API keys are read from `process.env` (server-side only).
    *   **Files:** `frontend/src/lib/llm.ts` (new), `backend/src/services/llmService.ts` (source)

2.  **Memory Service:**
    *   **Action:** Move memory management functions to a Next.js utility module.
    *   **Details:** Move functions like `updateUserContext`, `formatContextForPrompt`, `getLastNMessages`, `getConversationMessages`, `formatMessagesForSummarization`, etc., from `backend/src/services/memoryService.ts` to `frontend/src/lib/memory.ts`. Update imports to use the local Prisma client (`@/lib/prisma`) and LLM utilities (`@/lib/llm`).
    *   **Files:** `frontend/src/lib/memory.ts` (new), `backend/src/services/memoryService.ts` (source)

3.  **Prompt Service:**
    *   **Action:** Move system prompt management functions.
    *   **Details:** Move functions like `getAllSystemPrompts`, `getActiveSystemPrompt`, `getUserActiveSystemPrompt`, `createSystemPrompt`, etc., from `backend/src/services/promptService.ts` to `frontend/src/lib/prompts.ts`. Update imports to use the local Prisma client.
    *   **Files:** `frontend/src/lib/prompts.ts` (new), `backend/src/services/promptService.ts` (source)

4.  **Email Service:**
    *   **Action:** Move email sending and logging functions.
    *   **Details:** Move functions like `sendAiEmailToUser`, `generateCustomEmailContent`, `getUserEmailLogs`, `getAllEmailLogs` from `backend/src/services/emailService.ts` to `frontend/src/lib/email.ts`. Update imports for Prisma, LLM utilities. Ensure SendGrid API key is read from `process.env`. Move the `backend/src/emailTemplates` directory to `frontend/src/lib/email/templates` and update path resolution in `lib/email.ts` (using `path.join(process.cwd(), 'src/lib/email/templates/base.html')`).
    *   **Files:** `frontend/src/lib/email.ts` (new), `frontend/src/lib/email/templates/` (new dir), `backend/src/services/emailService.ts` (source), `backend/src/emailTemplates/` (source)

5.  **Transcription Service:**
    *   **Action:** Move audio transcription function.
    *   **Details:** Move `transcribeAudio` from `backend/src/services/transcriptionService.ts` to `frontend/src/lib/transcription.ts`. Ensure OpenAI key is read from `process.env`. Note: File handling (`fs`) will work in API routes but requires careful implementation.
    *   **Files:** `frontend/src/lib/transcription.ts` (new), `backend/src/services/transcriptionService.ts` (source)

6.  **Testing & Eval Services:**
    *   **Action:** Move testing and evaluation logic.
    *   **Details:** Move functions from `backend/src/services/testingService.ts` and `backend/src/services/evalService.ts` to `frontend/src/lib/testing.ts` and `frontend/src/lib/evaluation.ts` respectively. Update imports for Prisma, LLM, Prompts utilities.
    *   **Files:** `frontend/src/lib/testing.ts` (new), `frontend/src/lib/evaluation.ts` (new), `backend/src/services/testingService.ts` (source), `backend/src/services/evalService.ts` (source)

**Phase 4: API Route Implementation**

*   **General Approach:** For each `backend/src/routes/*.ts` file, create a corresponding `frontend/src/app/api/.../route.ts` file (or folder structure). Inside each `route.ts`, implement functions like `export async function GET(request: Request) {}`, `export async function POST(request: NextRequest) {}`, etc.
*   **Authentication:** Use `const { userId } = auth();` from `@clerk/nextjs` inside route handlers to get the user ID and ensure authentication.
*   **Request Body:** Parse JSON body using `const body = await request.json();`.
*   **Responses:** Return JSON responses using `import { NextResponse } from 'next/server'; return NextResponse.json({ ... });`.
*   **Error Handling:** Implement `try...catch` blocks.

1.  **Chat Route:**
    *   **Action:** Implement the chat endpoint.
    *   **File:** `frontend/src/app/api/chat/route.ts`
    *   **Logic:** Replicate the logic from `backend/src/routes/chatRoutes.ts`. Get `userId` via `auth()`. Parse `message`, `overridePromptId`, `useContext`, `conversationId` from `await request.json()`. Call migrated functions from `lib/prompts`, `lib/memory`, `lib/llm`. Save messages using `lib/prisma`. Return `NextResponse.json(...)`.

2.  **Admin Routes:**
    *   **Action:** Implement admin endpoints (prompts, users, history, summary, logs, feedback, email).
    *   **Files:** `frontend/src/app/api/admin/system-prompts/route.ts`, `frontend/src/app/api/admin/system-prompts/[id]/route.ts`, `frontend/src/app/api/admin/system-prompts/[id]/activate/route.ts`, `frontend/src/app/api/admin/users/route.ts`, etc.
    *   **Logic:** Replicate logic from `backend/src/routes/adminRoutes.ts`. Use `auth()` for user ID. Implement admin check logic (e.g., checking `userId` against `FOUNDER_CLERK_IDS` from `process.env`). Call migrated service functions (`lib/prompts`, `lib/memory`, `lib/email`, etc.) and Prisma.

3.  **Email Routes:**
    *   **Action:** Implement email endpoints.
    *   **Files:** `frontend/src/app/api/email/send/route.ts`, `frontend/src/app/api/email/logs/[userId]/route.ts`, `frontend/src/app/api/email/logs/route.ts` (admin).
    *   **Logic:** Replicate logic from `backend/src/routes/emailRoutes.ts`. Use `auth()`. Call functions from `lib/email`.

4.  **Eval Routes:**
    *   **Action:** Implement evaluation endpoints.
    *   **Files:** `frontend/src/app/api/eval/personas/route.ts`, `frontend/src/app/api/eval/run/route.ts`, etc.
    *   **Logic:** Replicate logic from `backend/src/routes/evalRoutes.ts`. Use `auth()`. Implement admin check. Call functions from `lib/evaluation`. Handle progress tracking state if needed (might require a different approach than in-memory map for serverless).

5.  **Feedback Routes:**
    *   **Action:** Implement feedback endpoint.
    *   **File:** `frontend/src/app/api/feedback/route.ts`
    *   **Logic:** Replicate logic from `backend/src/routes/feedbackRoutes.ts`. Use `auth()`. Parse body. Use Prisma to create feedback.

6.  **Legal Routes:**
    *   **Action:** Implement legal document retrieval and acceptance endpoints.
    *   **Files:** `frontend/src/app/api/legal/[doc]/route.ts`, `frontend/src/app/api/legal/accept/route.ts`, `frontend/src/app/api/legal/acceptance/route.ts`.
    *   **Logic:** Replicate logic from `backend/src/routes/legalRoutes.ts`. Use `auth()` for protected routes. Read markdown files (ensure they are moved to `frontend` project, e.g., `frontend/legal/`). Use Prisma for acceptance tracking.

7.  **Testing Routes:**
    *   **Action:** Implement testing endpoints.
    *   **Files:** `frontend/src/app/api/testing/ping/route.ts`, `frontend/src/app/api/testing/run-sequence/route.ts`, etc.
    *   **Logic:** Replicate logic from `backend/src/routes/testingRoutes.ts`. Use `auth()` if needed. Call functions from `lib/testing`. Handle progress tracking.

8.  **Voice Route:**
    *   **Action:** Implement transcription endpoint.
    *   **File:** `frontend/src/app/api/voice/transcribe/route.ts`
    *   **Logic:** Replicate logic from `backend/src/routes/voiceRoutes.ts`. Use `auth()`. Handle file uploads: This is different in Next.js API routes compared to Express/Multer. You'll likely need to parse `request.formData()` and handle the file stream/buffer, saving temporarily if needed before passing to `lib/transcription.ts`.
    *   **Note:** Consider client-side uploads directly to a storage service (like S3, Cloudinary) and passing the URL to the API route as an alternative to handling raw uploads in the serverless function.

**Phase 5: Middleware Implementation**

1.  **User Sync:**
    *   **Action:** Ensure user exists in DB on authenticated requests.
    *   **Details:** This logic from `backend/src/middleware/syncUser.ts` can often be integrated into the Clerk `afterAuth` hook within `frontend/src/middleware.ts` or checked within individual API routes upon first interaction if needed. Clerk's `auth().userId` guarantees an authenticated user. Check/create in DB using Prisma if the user record is essential beyond just the Clerk ID.

2.  **Terms Check:**
    *   **Action:** Protect routes based on terms acceptance.
    *   **Details:** Replicate logic from `backend/src/middleware/requireTerms.ts`. This check can be added within the main `frontend/src/middleware.ts` after the Clerk auth check, redirecting or returning an error if terms aren't accepted for protected paths. Alternatively, check within specific API routes using Prisma.

3.  **Admin Check:**
    *   **Action:** Protect admin API routes.
    *   **Details:** Implement logic within `frontend/src/middleware.ts` (checking `auth().userId` against `process.env.FOUNDER_CLERK_IDS`) for paths starting with `/api/admin`, or perform the check at the beginning of each admin API route handler.

**Phase 6: Frontend Refactoring**

1.  **API Service (`useApi`, `api.ts`):**
    *   **Action:** Refactor or remove the API service hooks/files.
    *   **Details:** The core purpose of `useApi` was to add auth tokens and point to the external backend URL.
        *   Internal API calls (`fetch('/api/chat')`) within the Next.js app don't typically need manual token injection when called from the client (Clerk handles session). Server-side calls don't need it either.
        *   Replace calls like `api.chat.sendMessage(...)` with:
            *   `fetch('/api/chat', { method: 'POST', body: JSON.stringify(...) })` from client components/hooks.
            *   Server Actions.
            *   Direct calls to `lib/` functions from Server Components (for GET requests).
    *   **Files:** `frontend/src/hooks/useApi.ts`, `frontend/src/services/api.ts`, `frontend/src/services/evalApi.ts`, `frontend/src/services/testingApi.ts` (Need significant refactoring or removal).

2.  **Data Fetching in Components/Contexts:**
    *   **Action:** Update how contexts and components fetch data.
    *   **Details:**
        *   `ChatContext`: Modify `sendMessage` to use `fetch('/api/chat', ...)` or a Server Action.
        *   `SystemPromptContext`: Modify `loadPrompts`, `activatePrompt`, etc., to use `fetch('/api/admin/system-prompts', ...)` or Server Actions/Components.
        *   Admin Screens: Update data fetching to use `fetch` against `/api/admin/...` routes or Server Components.
    *   **Files:** `frontend/src/context/*.tsx`, `frontend/src/screens/*.tsx`

**Phase 7: Cleanup**

1.  **Remove Backend Directory:** Once migration is complete and tested, the entire `backend` directory can be removed.
2.  **Dependency Cleanup:** Remove unused dependencies from `frontend/package.json` (e.g., `axios` if fully replaced by `fetch` or Server Actions, `@clerk/clerk-expo`).

---

## Migration Checklist (`todo.md`)

```markdown
# Backend to Next.js Migration Checklist

## Phase 1: Setup & Configuration

-   [ ] Consolidate all necessary environment variables from `backend/.env*` into `frontend/.env.local`.
-   [ ] Ensure server-only variables (API keys, DB URL, Clerk Secret) in `frontend/.env.local` do **NOT** have `NEXT_PUBLIC_` prefix.
-   [ ] Ensure client-needed variables (Clerk Publishable Key) in `frontend/.env.local` **DO** have `NEXT_PUBLIC_` prefix.
-   [ ] Add required backend dependencies to `frontend/package.json`.
-   [ ] Remove backend-only dependencies (`express`, `cors`, etc.) from `frontend/package.json` (if accidentally added).
-   [ ] Run `npm install` / `yarn install` in `frontend`.
-   [ ] Move `backend/prisma` directory to `frontend/prisma`.
-   [ ] Create Prisma client utility (`frontend/src/lib/prisma.ts`).
-   [ ] Run `npx prisma generate` in `frontend`.
-   [ ] Verify database connection from Next.js environment.

## Phase 2: Authentication Migration

-   [ ] Remove `@clerk/clerk-sdk-node` and `@clerk/clerk-expo` dependencies.
-   [ ] Add `@clerk/nextjs` dependency.
-   [ ] Wrap root layout (`frontend/src/app/layout.tsx`) with `<ClerkProvider>`.
-   [ ] Create and configure `frontend/src/middleware.ts` using `clerkMiddleware`.
-   [ ] Define public routes in `middleware.ts`.

## Phase 3: Service Logic Migration

-   [ ] Create `frontend/src/lib/` directory (if not exists).
-   [ ] Migrate functions from `backend/src/services/llmService.ts` to `frontend/src/lib/llm.ts`.
    -   [ ] Update imports (remove Express types).
    -   [ ] Ensure API keys are read via `process.env`.
-   [ ] Migrate functions from `backend/src/services/memoryService.ts` to `frontend/src/lib/memory.ts`.
    -   [ ] Update imports (`@/lib/prisma`, `@/lib/llm`).
-   [ ] Migrate functions from `backend/src/services/promptService.ts` to `frontend/src/lib/prompts.ts`.
    -   [ ] Update imports (`@/lib/prisma`).
-   [ ] Migrate functions from `backend/src/services/emailService.ts` to `frontend/src/lib/email.ts`.
    -   [ ] Update imports (`@/lib/prisma`, `@/lib/llm`).
    -   [ ] Move `backend/src/emailTemplates` to `frontend/src/lib/email/templates`.
    -   [ ] Update template path resolution in `lib/email.ts`.
-   [ ] Migrate function from `backend/src/services/transcriptionService.ts` to `frontend/src/lib/transcription.ts`.
    -   [ ] Update imports.
-   [ ] Migrate functions from `backend/src/services/testingService.ts` to `frontend/src/lib/testing.ts`.
    -   [ ] Update imports (`@/lib/prisma`, `@/lib/llm`, `@/lib/prompts`).
-   [ ] Migrate functions from `backend/src/services/evalService.ts` to `frontend/src/lib/evaluation.ts`.
    -   [ ] Update imports (`@/lib/prisma`, `@/lib/llm`, `@/lib/prompts`).

## Phase 4: API Route Implementation

-   [ ] Create `frontend/src/app/api/chat/route.ts`.
    -   [ ] Implement `POST` handler using migrated services (`lib/prompts`, `lib/memory`, `lib/llm`, `lib/prisma`).
    -   [ ] Use `auth()` for user ID.
    -   [ ] Use `NextResponse.json` for responses.
-   [ ] Create `frontend/src/app/api/admin/...` routes.
    -   [ ] Implement handlers for system prompts (GET, POST, PUT, DELETE, activate).
    -   [ ] Implement handlers for users (GET).
    -   [ ] Implement handlers for history (GET).
    -   [ ] Implement handlers for summary (GET, POST generate).
    -   [ ] Implement handlers for summarization logs (GET).
    -   [ ] Implement handlers for feedback (GET, PUT status, PUT content).
    -   [ ] Implement handlers for email logs (GET).
    -   [ ] Implement handlers for sending AI email (POST).
    -   [ ] Add admin authorization check (`auth().userId` vs `FOUNDER_CLERK_IDS`).
-   [ ] Create `frontend/src/app/api/email/...` routes.
    -   [ ] Implement `send` (POST).
    -   [ ] Implement `logs/[userId]` (GET).
    -   [ ] Implement `logs` (GET - admin).
-   [ ] Create `frontend/src/app/api/eval/...` routes.
    -   [ ] Implement handlers for personas, run, run-single, results, leaderboard, delete evaluation.
    -   [ ] Add admin authorization check.
-   [ ] Create `frontend/src/app/api/feedback/route.ts`.
    -   [ ] Implement `POST` handler.
-   [ ] Create `frontend/src/app/api/legal/...` routes.
    -   [ ] Implement `[doc]` (GET).
    -   [ ] Implement `accept` (POST).
    -   [ ] Implement `acceptance` (GET).
    -   [ ] Move markdown files to `frontend/legal/`.
-   [ ] Create `frontend/src/app/api/testing/...` routes.
    -   [ ] Implement `ping` (GET).
    -   [ ] Implement `run-sequence` (POST).
    -   [ ] Implement `run-protocol` (POST).
    -   [ ] Implement `send-email` (POST).
    -   [ ] Implement `progress/[testId]` (GET).
-   [ ] Create `frontend/src/app/api/voice/transcribe/route.ts`.
    -   [ ] Implement `POST` handler.
    -   [ ] Implement file upload handling using `request.formData()`.
    -   [ ] Call `lib/transcription.ts`.

## Phase 5: Middleware Implementation

-   [ ] Implement user sync logic (check/create user in DB) in `middleware.ts` or API routes if needed.
-   [ ] Implement terms check logic in `middleware.ts` for relevant paths.
-   [ ] Implement admin check logic in `middleware.ts` for `/api/admin/*` paths.

## Phase 6: Frontend Refactoring

-   [ ] Refactor or remove `frontend/src/hooks/useApi.ts`.
-   [ ] Refactor or remove `frontend/src/services/api.ts`.
-   [ ] Refactor or remove `frontend/src/services/evalApi.ts`.
-   [ ] Refactor or remove `frontend/src/services/testingApi.ts`.
-   [ ] Update `ChatContext` (`frontend/src/context/ChatContext.tsx`) to use `fetch` or Server Actions for `sendMessage`.
-   [ ] Update `SystemPromptContext` (`frontend/src/context/SystemPromptContext.tsx`) to use `fetch` or Server Actions/Components for data fetching/mutations.
-   [ ] Update Admin screens (`frontend/src/screens/Admin*.tsx`, `SummarizationStatusScreen.tsx`, `FeedbackScreen.tsx`) to fetch data using `fetch` or Server Components.
-   [ ] Update Eval screen (`frontend/src/screens/EvalScreen.tsx`) to use `fetch`.
-   [ ] Update Testing screen (`frontend/src/screens/TestingScreen.tsx`) to use `fetch`.
-   [ ] Update `FeedbackButton` (`frontend/src/components/FeedbackButton.tsx`) to use `fetch` or Server Action.
-   [ ] Review all components/screens previously using `useApi` and update data fetching/mutation logic.

## Phase 7: Cleanup & Verification

-   [ ] Test all application features thoroughly (chat, admin functions, email sending, etc.).
-   [ ] Verify data is being correctly read from and written to the database via the Next.js app.
-   [ ] Verify authentication and authorization rules are working correctly.
-   [ ] Once confident, delete the `backend` directory.
-   [ ] Remove any remaining unused dependencies from `frontend/package.json`.
-   [ ] Review console logs for any errors or warnings.

```

This plan provides a structured approach, and the checklist offers a way to track progress. Remember to test thoroughly after each major phase.