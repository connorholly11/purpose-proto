# NOTE: This file is deprecated.
# Please use the following dedicated .env files instead:
# - backend/.env for backend environment variables
# - frontend/.env for frontend environment variables

# This approach separates concerns and makes it clearer which variables
# apply to which part of the application.
# See deployment.md for details on configuring environment variables for production.

# .env (Comprehensive - For use in BOTH Frontend & Backend during LOCAL DEVELOPMENT)
# WARNING: Contains sensitive backend keys. Ensure non-EXPO_PUBLIC_ variables are NOT bundled in frontend code.
# WARNING: Some variables are only used by Frontend, some only by Backend. See comments.
# WARNING: Values like API URLs and CORS origins need adjustment for deployment.

# --- Application Configuration ---
NODE_ENV=development # USED BY: Backend (Typically)
APP_NAME="AI Companion MVP" # USED BY: Frontend/Backend (Optional Display/Logging)
PORT=3001 # USED BY: Backend (Local dev server port)

# --- Frontend Configuration ---
# URL of the backend API service (MUST be updated for deployment)
EXPO_PUBLIC_API_URL="http://localhost:3001" # USED BY: Frontend

# Clerk Publishable Key (Safe for frontend)
# Replace with your actual Clerk Publishable Key
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YWNjZXB0ZWQtdGVycmFwaW4tNjAuY2xlcmsuYWNjb3VudHMuZGV2JA

# --- Backend Configuration ---
# Database connection string (KEEP SECRET)
# Replace with your actual Supabase connection string
DATABASE_URL="postgresql://postgres:Wnncdf11primetime555@db.hcxmvlnjwgxskvywnolv.supabase.co:5432/postgres" # USED BY: Backend

# Clerk Secret Key (KEEP SECRET - DO NOT EXPOSE TO FRONTEND BUNDLE)
# Replace with your actual Clerk Secret Key
CLERK_SECRET_KEY="sk_test_bZ5ikWdt3PIFU19RrhuNI4krSLqvys4YrKhdb9qrlW" # USED BY: Backend

# LLM API Key (KEEP SECRET - DO NOT EXPOSE TO FRONTEND BUNDLE)
# Replace with your actual OpenAI or Anthropic API Key
LLM_API_KEY="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" # USED BY: Backend
# Optional: Specify models
CHAT_LLM_MODEL="chatgpt-4o-latest" # USED BY: Backend
SUMMARIZATION_LLM_MODEL="chatgpt-4o-latest" # USED BY: Backend

# Comma-separated list of ALL Clerk User IDs considered admins/founders for MVP access (KEEP SECRET if sensitive)
FOUNDER_CLERK_IDS=user_2v0kHfelRcU1cBqg5o47ZymuGvM,user_2v0kJwxV4JT2PaJKmaXZabSjFgM,user_2v0kIR1s6RI1tzMU0dF2HhH5LgG,user_2v0kMGsms1l0HxWxbtY3SRkSK9A,user_2v0kLICcJO5KHQhEOlFm9c3ojYn,user_2v0kKj7nLBrJBVE2vtLUburjVm6 # USED BY: Backend
# User Mapping Reference (Comment Only):
# user_2v0kMGsms1l0HxWxbtY3SRkSK9A = productive
# user_2v0kLICcJO5KHQhEOlFm9c3ojYn = depressed
# user_2v0kKj7nLBrJBVE2vtLUburjVm6 = anger
# user_2v0kHfelRcU1cBqg5o47ZymuGvM = connor
# user_2v0kJwxV4JT2PaJKmaXZabSjFgM = rajj
# user_2v0kIR1s6RI1tzMU0dF2HhH5LgG = mark

# CORS Configuration (MUST be updated for deployment)
CORS_ORIGIN=http://localhost:8081 # USED BY: Backend (Adjust for deployed frontend URL)

# --- Variables NOT NEEDED FOR MVP (Included as requested, but relate to RAG/Embeddings) ---
# Embedding model (KEEP SECRET if key is sensitive, used by Backend if doing RAG)
EMBEDDING_MODEL=text-embedding-3-small # USED BY: Backend (Post-MVP)

# Pinecone Vector DB Credentials (KEEP SECRET - DO NOT EXPOSE TO FRONTEND BUNDLE)
PINECONE_API_KEY=pcsk_o8Kz3_RtUsYcYu4QmVGiGtHA4amgHPVKmsqW39ns3HABASgcYaP6zE6iztPZ5NZNpJaUs # USED BY: Backend (Post-MVP)
PINECONE_HOST=https://purpose-proto-d92a0c2.svc.aped-4627-b74a.pinecone.io # USED BY: Backend (Post-MVP)
PINECONE_INDEX=purpose-proto # USED BY: Backend (Post-MVP)

# --- Deprecated/Alternative Variables (Included as requested) ---
# Note: EXPO_PUBLIC_API_URL is the preferred Expo variable for frontend API URL
REACT_APP_API_URL="https://pre-proto-rn-backend.onrender.com" # Alternative/Legacy - Prefer EXPO_PUBLIC_API_URL

# Note: LLM_API_KEY is preferred over OPENAI_API_KEY for provider neutrality
OPENAI_API_KEY=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 # Alternative/Legacy - Prefer LLM_API_KEY

ANTHROPIC_API_KEY=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

Deepseek-api-key=sk-ef26677c65694f8e8cccffb0866b0065

Gemini-api-key=AIzaSyBPJDMEEHZIxP79CKuycOyFNsdynoDHRVI

SENDGRID_API_KEY=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

Name:Apple Push Notification Auth Key
Key ID:68B2T84QFF
Services:Apple Push Notifications service (APNs), WeatherKit


# Next.js Frontend Environment Variables (.env - Default values, safe to commit)

# App Configuration
NODE_ENV=development
APP_NAME="AI Companion"

# Set the model to use by default for chat
CHAT_LLM_MODEL="chatgpt-4o-latest"
SUMMARIZATION_LLM_MODEL="chatgpt-4o-latest"

# Debug options
DEBUG_TOKEN_ESTIMATE=false

# Terms version
TERMS_VERSION=1.0

# Note: For sensitive values like API keys and secrets, use .env.local instead,
# which is not committed to version control

# .env (Comprehensive - For use in BOTH Frontend & Backend during LOCAL DEVELOPMENT)
# WARNING: Contains sensitive backend keys. Ensure non-EXPO_PUBLIC_ variables are NOT bundled in frontend code.
# WARNING: Some variables are only used by Frontend, some only by Backend. See comments.
# WARNING: Values like API URLs and CORS origins need adjustment for deployment.

# --- Application Configuration ---
NODE_ENV=development # USED BY: Backend (Typically)
APP_NAME="AI Companion MVP" # USED BY: Frontend/Backend (Optional Display/Logging)
PORT=3001 # USED BY: Backend (Local dev server port)

# --- Frontend Configuration ---
# URL of the backend API service (MUST be updated for deployment)
EXPO_PUBLIC_API_URL="http://localhost:3001" # USED BY: Frontend

# Clerk Publishable Key (Safe for frontend)
# Replace with your actual Clerk Publishable Key
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YWNjZXB0ZWQtdGVycmFwaW4tNjAuY2xlcmsuYWNjb3VudHMuZGV2JA

# --- Backend Configuration ---
# Database connection string (KEEP SECRET)
# **Updated → now points at the Shared Pooler (session mode) which is dual-stack IPv4/IPv6**
DATABASE_URL="postgresql://postgres.hcxmvlnjwgxskvywnolv:Wnncdf11primetime555@aws-0-us-west-1.pooler.supabase.com:5432/postgres"

# Clerk Secret Key (KEEP SECRET - DO NOT EXPOSE TO FRONTEND BUNDLE)
CLERK_SECRET_KEY="sk_test_bZ5ikWdt3PIFU19RrhuNI4krSLqvys4YrKhdb9qrlW" # USED BY: Backend

# LLM API Key (KEEP SECRET - DO NOT EXPOSE TO FRONTEND BUNDLE)
LLM_API_KEY="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" # USED BY: Backend
# Optional: Specify models
CHAT_LLM_MODEL="chatgpt-4o-latest" # USED BY: Backend
SUMMARIZATION_LLM_MODEL="chatgpt-4o-latest" # USED BY: Backend

# Comma-separated list of ALL Clerk User IDs considered admins/founders for MVP access (KEEP SECRET if sensitive)
FOUNDER_CLERK_IDS=user_2v0kHfelRcU1cBqg5o47ZymuGvM,user_2v0kJwxV4JT2PaJKmaXZabSjFgM,user_2v0kIR1s6RI1tzMU0dF2HhH5LgG,user_2v0kMGsms1l0HxWxbtY3SRkSK9A,user_2v0kLICcJO5KHQhEOlFm9c3ojYn,user_2v0kKj7nLBrJBVE2vtLUburjVm6 # USED BY: Backend
# User Mapping Reference (Comment Only):
# user_2v0kMGsms1l0HxWxbtY3SRkSK9A = productive
# user_2v0kLICcJO5KHQhEOlFm9c3ojYn = depressed
# user_2v0kKj7nLBrJBVE2vtLUburjVm6 = anger
# user_2v0kHfelRcU1cBqg5o47ZymuGvM = connor
# user_2v0kJwxV4JT2PaJKmaXZabSjFgM = rajj
# user_2v0kIR1s6RI1tzMU0dF2HhH5LgG = mark

# CORS Configuration (MUST be updated for deployment)
# Comma-separated list of allowed origins. No trailing slashes.
CORS_ALLOWED_ORIGINS=https://purpose-gemini-proto.vercel.app,http://localhost:8081,http://localhost:8082,http://localhost:8083,http://172.20.10.2:3001

# --- Variables NOT NEEDED FOR MVP (Included as requested, but relate to RAG/Embeddings) ---
EMBEDDING_MODEL=text-embedding-3-small # USED BY: Backend (Post-MVP)

PINECONE_API_KEY=pcsk_o8Kz3_RtUsYcYu4QmVGiGtHA4amgHPVKmsqW39ns3HABASgcYaP6zE6iztPZ5NZNpJaUs # USED BY: Backend (Post-MVP)
PINECONE_HOST=https://purpose-proto-d92a0c2.svc.aped-4627-b74a.pinecone.io # USED BY: Backend (Post-MVP)
PINECONE_INDEX=purpose-proto # USED BY: Backend (Post-MVP)

# --- Deprecated/Alternative Variables (Included as requested) ---
REACT_APP_API_URL="https://pre-proto-rn-backend.onrender.com" # Alternative/Legacy - Prefer EXPO_PUBLIC_API_URL

OPENAI_API_KEY=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 # Alternative/Legacy - Prefer LLM_API_KEY

# Removed duplicate CORS entry and using the single one above
# CORS_ALLOWED_ORIGINS=https://purpose-gemini-proto.vercel.app,http://localhost:8081,http://localhost:8082,http://localhost:8083

ANTHROPIC_API_KEY=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

DEEPSEEK_API_KEY=sk-ef26677c65694f8e8cccffb0866b0065

GOOGLE_API_KEY=AIzaSyBPJDMEEHZIxP79CKuycOyFNsdynoDHRVI

SENDGRID_API_KEY=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
SENDGRID_FROM_EMAIL=connor@heypurpose.com
ALLOW_PUSH_TEST_ENDPOINT=true
ENABLE_PUSH_SNIPPETS=true

# System Prompt Configuration
# The default system prompt ID for all users
DEFAULT_SYSTEM_PROMPT_ID=cm8xiy1b40000yg0l4xzmbqxs
