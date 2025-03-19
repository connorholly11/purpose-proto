Below is a **rules.md** file adjusted for our AI Companion project (with both a backend and a frontend). This document outlines coding guidelines, file structure, and best practices so that any developer or AI agent can implement the system in a consistent, maintainable, and agile manner.

---

# AI Companion Project – Development Guidelines & Rules

We aim for a **7.5/10** code quality standard. This means the code should be professional, maintainable, and sufficiently documented without incurring excessive overhead. We want clean, consistent, typed code with well-organized services and minimal duplication.

---

## **1. Code Organization & Layering**

### **1.1 API Endpoints (Backend)**
- **Location:** `server/api/` or `backend/api/`
- **Responsibilities:**
  - Handle HTTP-specific concerns: request parsing, status codes, headers, and response formatting.
  - Authenticate and authorize early in the request lifecycle.
  - Keep routes lean—delegate business logic to service layers.

### **1.2 Services (Backend)**
- **Location:** `server/services/` or `backend/lib/services/`
- **Responsibilities:**
  - Encapsulate business logic and external integrations (e.g., OpenAI API calls, Pinecone interactions, database access via Prisma).
  - Be modular and focused on a specific domain (chat processing, voice processing, RAG integration, etc.).
  - Design services to be testable in isolation with clear dependencies.

### **1.3 Components (Frontend)**
- **Location:** `app/components/`
- **Responsibilities:**
  - Handle user interactions and UI rendering.
  - Focus on presentation logic while delegating data fetching or state management to custom hooks or context providers.
  - Decompose complex components into smaller, reusable sub-components.

### **1.4 Utilities & Helpers**
- **Location:** `utils/` for generic utilities and `lib/helpers/` for specialized logic.
- **Responsibilities:**
  - Implement pure functions with clear inputs and outputs.
  - Keep utilities small, focused, and well-documented.
  - Extract any multi-purpose or growing utility into its own module or folder.

### **1.5 Types**
- **Location:** `types/`
- **Responsibilities:**
  - Define domain-specific types and interfaces for both frontend and backend.
  - Organize types logically (e.g., separate API types, domain models, component props).
  - Export from a central location to maintain consistency and prevent duplication.

### **1.6 Context & State (Frontend)**
- **Location:** `app/contexts/`
- **Responsibilities:**
  - Manage global or deeply nested state.
  - Keep data flows straightforward—prefer prop drilling when possible.
  - Document purpose and structure of each context.

---

## **2. File Size & Complexity**

### **2.1 API Routes**
- **Ideal:** 50–75 lines (maximum 100 lines)
- **Guidelines:**
  - Focus solely on HTTP concerns: validation, request handling, and invoking services.
  - If a route grows beyond 100 lines, refactor by moving logic to service layers or splitting into sub-routes.

### **2.2 React Components**
- **Ideal:** 150–250 lines (maximum 300 lines)
- **Guidelines:**
  - Ensure each component has a single responsibility.
  - Break down larger components into smaller subcomponents or use custom hooks.

### **2.3 Page Components**
- **Ideal:** 100–200 lines (maximum 250 lines)
- **Guidelines:**
  - Pages should primarily orchestrate other components and manage layout.
  - Extract complex sections into separate components or custom hooks.

### **2.4 Services & Utilities**
- **Ideal:** 150–250 lines (maximum 300 lines)
- **Guidelines:**
  - Split large services into domain-specific sub-services.
  - Extract reusable parts into dedicated utility functions.

---

## **3. Real-Time Data & API Communication**

### **3.1 WebSocket and Streaming (If Applicable)**
- **Encapsulation:**
  - Keep real-time communication logic (for voice streaming or real-time TTS) in dedicated service modules.
  - Standardize reconnection logic (e.g., exponential backoff) and message handling.
  - Validate and log messages with clear types from the `types/` directory.

### **3.2 API Communication**
- **OpenAI Integration:**
  - Structure API calls for GPT-4, Whisper, TTS, and Embeddings within service modules.
  - Use streaming (where applicable) to minimize latency for chat responses and TTS.
  - Handle rate limits and errors gracefully; implement retries or fallback messages as needed.
- **Pinecone Integration (for RAG):**
  - Separate embedding generation, upsert, and query logic in its own service.
  - Keep vector operations efficient and modular.
- **Database Access (via Prisma & Supabase):**
  - Encapsulate all database queries in services; never directly access the DB from API endpoints or components.
  - Use well-defined schema and types for logging and conversation history.

---

## **4. Error Handling & Logging**

### **4.1 Error Management**
- Use centralized error handling within services.
- Provide custom error classes for domain-specific issues.
- Always include context (e.g., request IDs, relevant data) when logging errors.

### **4.2 Logging**
- Use structured logging (avoid raw console logs in production).
- Ensure logs include enough detail for debugging without exposing sensitive information.
- Consistently log API request and response statuses, especially for external integrations.

### **4.3 API Responses**
- Return structured JSON responses (e.g., `{ error: "...", details?: any }`).
- Always include HTTP status codes and clear, actionable error messages.
- Log request details in case of errors for easier correlation during debugging.

---

## **5. Data Transformation & Naming**

### **5.1 Helper Functions**
- Keep transformation functions pure, small, and clearly typed.
- Group similar utility functions together.
- Document non-obvious business rules and transformations.

### **5.2 Naming Conventions**
- Use descriptive names that clearly indicate purpose.
- Follow consistent naming patterns across similar modules and files.
- Favor clarity over brevity; longer, self-documenting names are preferred if they enhance readability.

---

## **6. Database & Prisma**

### **6.1 Database Access**
- Use Prisma as the ORM; centralize access through a dedicated database module.
- All database queries and mutations should live in service layers.
- Use transactions where needed, and document complex queries.

### **6.2 Schema Management**
- Keep the Prisma schema in a dedicated folder (e.g., `prisma/`).
- Maintain clear migration files with proper documentation.
- Version your schema and test migrations in a staging environment before production.

---

## **7. Documentation**

### **7.1 README & Project Docs**
- Keep a central `README.md` outlining project setup, key architectural decisions, and deployment instructions.
- Create additional markdown files for API docs, integration details (e.g., for OpenAI and Pinecone), and deployment guides.
- Update documentation with every major change.

### **7.2 Code Comments**
- Provide doc blocks at the top of major service files and functions explaining their purpose.
- Document public methods with their inputs, outputs, and side effects.
- Focus on explaining the “why” behind design choices rather than every implementation detail.

---

## **8. Striving for 7.5**

- **Maintainability:** Write code that’s easy for newcomers to understand and modify. Favor clarity over clever shortcuts.
- **Consistency:** Use the same patterns across both the frontend and backend. Consistent file structure, naming, and error handling will reduce cognitive load.
- **Testability:** Implement essential tests for critical paths. Ensure services, particularly those interacting with external APIs, are covered.
- **Balance:** Achieve professional quality without overengineering. Code should be sufficiently documented, with clear separation of concerns and minimal duplication.

### **What NOT to Do**
- Avoid overcomplicating trivial tasks with heavy frameworks.
- Don’t deviate from established patterns without strong reasons.
- Don’t over-optimize prematurely; focus on clarity and maintainability.
- Don’t introduce dependencies for minor functionalities—keep the code lightweight.

---

By following these guidelines, the codebase for the AI Companion (both frontend and backend) will be clean, consistent, and ready for agile development. This structure ensures developers can quickly onboard, understand the flow, and maintain the system with ease.

