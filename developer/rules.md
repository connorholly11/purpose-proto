# RULES.md - Development Guidelines for AI Companion MVP

This document outlines the essential rules and guidelines for developing the AI Companion MVP. Adherence to these rules is crucial for maintaining focus, ensuring code quality, security, and alignment with the project's goals and chosen architecture.

**Developer:** Please read these rules carefully before starting and refer back to them throughout the implementation process. Ask for clarification if any rule is unclear.

**Core Principles:**

1.  **MVP Focus:** Implement *only* the features and steps outlined in the detailed MVP build plan (`PLAN.md` or equivalent). Do **NOT** implement features designated for later phases (e.g., RAG, advanced async processing beyond the basic trigger, full user management beyond Clerk). The goal is speed and validation of the core memory concept via summarization.
2.  **Adhere to Stack:** Strictly use the defined technology stack (React Native/Expo, Clerk, Node.js/Express, Supabase/Postgres, Prisma). Do not introduce new major libraries, frameworks, or services without explicit prior approval.
3.  **Quality & Maintainability:** Write clean, readable, well-documented (where necessary), and maintainable code. Follow established best practices for TypeScript, Node.js, and React Native.
4.  **Security First:** Treat security as paramount, especially regarding API keys, user data, and authentication/authorization.

**Technology Stack Usage:**

1.  **Frontend:** Use React Native with Expo (targeting Web initially). Utilize functional components and hooks. Manage state appropriately (e.g., `useState`, `useContext`, or a simple state manager if needed).
2.  **Backend:** Use Node.js with Express and TypeScript. Structure the application logically (e.g., routes, controllers, services, utils).
3.  **Database ORM:** Use **Prisma Client** for ALL interactions with the Supabase/Postgres database. Define the schema accurately in `prisma/schema.prisma`. Use Prisma Migrate (`npx prisma migrate dev`) for ALL schema changes.
4.  **Authentication:** Use **Clerk** for all user authentication and session management as specified in the plan (both frontend SDK and backend SDK/middleware).
5.  **LLM:** Interact with the chosen LLM (OpenAI/Anthropic) via secure API calls ONLY from the backend service. Abstract LLM calls into a dedicated helper function/service.

**Backend Development Guidelines:**

1.  **API Design:** Design RESTful API endpoints. Use appropriate HTTP methods (GET, POST, PUT, DELETE). Return meaningful HTTP status codes. Use JSON for request bodies and responses.
2.  **Input Validation:** Validate incoming request bodies and parameters (e.g., using a library like Zod or Express Validator) to prevent errors and potential security issues.
3.  **Error Handling:** Implement consistent error handling. Log errors effectively. Return user-friendly error messages in API responses where appropriate, avoiding leaking sensitive details.
4.  **Environment Variables:** Use the provided `.env` file structure for configuration and secrets. Access variables via `process.env`. Do NOT hardcode secrets or configuration values.
5.  **User Identification:** Consistently use the `clerkId` obtained from the verified Clerk JWT (`req.auth.userId`) as the primary user identifier when interacting with the database (`User`, `Message`, `StructuredSummary` relations).

**Frontend Development Guidelines:**

1.  **API Interaction:** Centralize backend API calls in a dedicated service/hook layer. Handle loading states, success responses, and errors gracefully in the UI.
2.  **Environment Variables:** Access frontend-specific environment variables ONLY via `process.env.EXPO_PUBLIC_...`. Ensure no backend secrets are exposed.
3.  **Component Structure:** Keep components focused and reusable where appropriate.

**Authentication & Authorization:**

1.  **Clerk Integration:** Follow Clerk documentation carefully for both frontend and backend setup.
2.  **Backend Middleware:** Ensure all necessary backend routes are protected by the Clerk authentication middleware.
3.  **Admin Authorization:** Implement the specific admin authorization middleware (`requireAdminAuth`) exactly as described, checking against the `FOUNDER_CLERK_IDS` list from `.env` for all `/admin/*` routes.

**Memory (Structured Summarization) Implementation:**

1.  **Focus:** Implement only the **Structured Summarization** mechanism for memory in the MVP. **DO NOT** implement RAG, vector embeddings, or Pinecone integration.
2.  **Structured JSON:** Strictly adhere to the defined JSON structure for the `StructuredSummary.summaryData`. Document this structure.
3.  **Summarization Prompt:** Carefully craft and iterate on the LLM prompt used for generating the structured summary. Ensure it explicitly requests JSON output.
4.  **Parsing & Validation:** Implement robust parsing and validation for the LLM's JSON output before saving it to the database. Log errors on failure.
5.  **Asynchronous Trigger:** Implement the summarization trigger asynchronously as specified (fire-and-forget with error logging for MVP) to avoid blocking user responses.
6.  **Prompt Injection:** Ensure the formatted summary context is correctly fetched and injected into the main chat LLM prompt.

**Admin & Debug Features:**

1.  **Admin UI:** Build only the specified Admin UI features (Prompt Management, User/Conversation Viewer). Ensure it is strictly protected for founder access only.
2.  **Debug View:** Implement the Chat Debug View (Prompt Dropdown, Debug Info Toggle/Panel) exactly as specified. Ensure it is only visible/functional for founder accounts based on `clerkId`.

**Security Practices:**

1.  **Secrets Management:** NEVER commit `.env` files containing real secrets to Git. Use environment variables provided by hosting platforms for deployment.
2.  **API Keys:** Ensure LLM API keys and Clerk Secret Keys are ONLY used in the backend and never exposed to the frontend bundle.
3.  **Authorization:** Double-check that all backend endpoints have appropriate authentication and (where necessary) authorization middleware applied.

**Code Quality & Style:**

1.  **TypeScript:** Utilize TypeScript's features for type safety. Avoid `any` where possible.
2.  **Linting/Formatting:** Set up and adhere to ESLint and Prettier rules for consistent code style.
3.  **Naming:** Use clear, descriptive names for variables, functions, files, and components.
4.  **Comments:** Add comments to explain complex logic, assumptions, or "why" something is done a certain way. Document function inputs/outputs where necessary.

**Version Control (Git):**

1.  **Commits:** Make frequent, small, atomic commits with clear, descriptive messages.
2.  **Branches:** Use feature branches for implementing specific steps or features. Create Pull Requests (PRs) for review before merging to the main branch (e.g., `main` or `develop`).
3.  **`.gitignore`:** Ensure `node_modules`, `.env` files, build artifacts, and other sensitive/unnecessary files are included in `.gitignore`.

**Communication & Questions:**

1.  **Clarification:** If any part of the plan, requirements, or these rules is unclear, **ASK FOR CLARIFICATION** before proceeding. Do not make assumptions.
2.  **Challenges:** Report any unexpected technical challenges or roadblocks promptly.

By following these rules alongside the detailed plan and `TODO.md`, the resulting MVP should be well-structured, secure, maintainable, and accurately reflect the intended vision and scope.