Below is an updated, end-to-end checklist that incorporates voice output (Hume TTS), voice input (STT), multi-LLM testing, and dynamic system prompts (friendly vs. challenging). It’s structured so you can tick off each item as you progress. This expands on the previous plan, ensuring you have all the core functionality plus these added features.

AI Companion Prototype: Comprehensive Checklist (with Voice I/O, Multi-LLM, Dynamic Prompts)
1. Project Setup & Repo Structure
Decide Repository Approach


Keep front-end (Next.js) in my-companion-frontend/.
Keep Node.js/Express backend in my-companion-backend/.
Or unify them using Next.js API routes if that’s easier for you.
Documentation


Maintain a README.md for environment variables, setup steps, and any references to Hume TTS or STT services.

2. Front End: Next.js (Vercel)
Initialize Next.js


npx create-next-app my-companion-frontend
Install dependencies: npm install (or yarn).
Styling & UI


Tailwind (optional but recommended for quick styling).
shadcn/ui for prebuilt components.
Front-End Pages / Components


Chat Interface


Text Input: Standard text box + “Send” button.
Voice Input: A “Record” button that captures microphone input in the browser, sends audio to backend for STT.
Chat Display: Show user messages, AI responses, along with any relevant metadata (like which LLM was used).
Logs / History Page


Displays conversation logs from your backend (/api/logs).
Allows rating (thumbs up/down).
Shows which LLM responded (if multi-LLM is used).
System Prompt Selection (Friendly vs. Challenging)


Radio buttons or a dropdown to select which “mode” (Friendly / Challenging).
This selection can be passed to the backend, so the backend knows which system prompt to use.
Front-End API Calls


POST /api/chat: Sends text or transcribed voice input, system prompt mode, selected LLM (optional).
GET /api/logs: Retrieves conversation log.
POST /api/rate: Sets thumbs up/down for a given conversation entry.
POST /api/stt: Sends audio from front-end to backend (for voice input).
POST /api/tts: If you want the front end to request TTS (or you can do TTS in the chat endpoint itself).
Voice Playback


After receiving TTS audio from the backend, the front end should automatically play or give a “Play” button.
Deployment


Vercel: Connect your front-end repo, set the environment variable NEXT_PUBLIC_BACKEND_URL if needed.

3. Backend: Node.js + Express (Heroku, Railway, etc.)
Initialize


npm init -y, install express, cors, fs, dotenv, etc.
Create server.js with essential routes.
.env Variables


LLM Keys (e.g., OPENAI_API_KEY, DEEPSEEK_API_KEY, etc.).
PINECONE_API_KEY, PINECONE_ENVIRONMENT (if doing RAG).
HUME_API_KEY for TTS (and possibly STT if they provide that).
Any other TTS/STT keys if you’re mixing providers (e.g., Whisper, Google STT).
Core Endpoints

 (a) /api/chat


Request Body: { userId, message, systemPromptMode, chosenLLM, isVoiceInput? }.
Process:
(Optional) RAG with Pinecone: embed user message, upsert, retrieve context.
Select the LLM based on chosenLLM or a random approach for multi-LLM testing.
Build System Prompt: If systemPromptMode === "Friendly", use the friendly system prompt; if “Challenging,” use the challenging prompt.
Call LLM and get response text.
(Optional) TTS: If the user or front-end wants immediate voice output, the backend can call Hume TTS here.
Log the conversation (user message, LLM response, rating = null, which LLM was used) to a local JSON file or database.
Response:
Returns the LLM text, selected LLM info, maybe an audio URL if TTS is done on the server.
(b) /api/tts


POST with { text, voiceConfig } (or minimal if Hume requires just text).
Call Hume TTS using HUME_API_KEY.
Return audio data or a link.
(c) /api/stt


POST with audio data from the front end.
Call STT service (Hume if available, or another STT).
Return the transcribed text to the front end, which then calls /api/chat.
(d) /api/logs


GET to fetch entire conversation log (or a subset).
Return an array of objects, each with { id, userId, userMessage, aiResponse, llmUsed, rating, timestamp }.
(e) /api/rate


POST with { id, rating }.
Update that entry in your logs to mark thumbs up/down.
Storing Logs


logs.json or a DB.
If ephemeral file systems (like Heroku’s free plan) cause log loss, consider:
A free-tier DB (Postgres on Railway, Supabase, etc.).
Or S3 for log files if a DB is too large a step.
Multi-LLM Logic


In /api/chat, check chosenLLM or randomly pick from [OpenAI, Deepseek, etc.].
Store llmUsed in the log so you can see which model responded.
Possibly let users pick from the UI which LLM to use for each question.
Dynamic System Prompts


Define two (or more) system prompts in your code: e.g., friendlyPrompt vs. challengingPrompt.
If front end sends systemPromptMode === "Friendly", use friendlyPrompt. Otherwise, challengingPrompt.
Deployment


Heroku:
heroku create my-companion-backend
git push heroku main
Set environment variables in Heroku “Config Vars.”
Or use Railway, which also has free Node hosting and possibly a free Postgres.
Ensure you update your front end with the correct backend URL.

4. Voice Input / Output in Detail
4a. Voice Output (Hume TTS)
Hume API Setup
Retrieve your HUME_API_KEY.
Check Hume TTS documentation for how to format requests (voice styles, language, etc.).
Backend Implementation:
Option A: TTS in the POST /api/chat endpoint.
After LLM returns text, call Hume TTS.
Return both text and audio in one response.
Option B: A separate POST /api/tts endpoint.
The front end calls /api/chat → gets text → then calls /api/tts.
Front-End Playback:
Create an <audio> element or use the HTML5 Audio API to play returned audio.
4b. Voice Input (STT)
Browser Mic Capture:
Use the MediaRecorder API or a library like react-media-recorder.
On “Stop Recording,” get the audio blob.
Upload to /api/stt:
The backend calls Hume STT (if they offer STT) or another service (OpenAI Whisper, Google STT, Deepgram, etc.).
Receive Transcription:
The front end then calls /api/chat with the transcribed text.

5. Multi-LLM Testing
LLM Selection in the front end:
A dropdown or toggle: “Use OpenAI” / “Use Deepseek” / “Random.”
Backend checks that selection in /api/chat.
Store which LLM was used in the conversation log.
Logs Page: show columns like “LLM Used” for each message.
Optionally do a 50/50 split randomly if you want strict A/B testing.

6. Dynamic System Prompts
Define Prompts in your server code:
 const friendlyPrompt = "You are a friendly AI, very supportive...";
const challengingPrompt = "You are a tough AI, challenging assumptions...";


Decide which to use in /api/chat:
 const systemPrompt = systemPromptMode === "Friendly" ? friendlyPrompt : challengingPrompt;


Append Pinecone context if using RAG.
Send to LLM as your system prompt.

7. Logs & Persistence
If you’re okay with ephemeral logs (reset on restarts), store them in logs.json on the Heroku file system.
If not, or you want more reliability:
Use a free-tier DB (Supabase, Railway Postgres, Mongo Atlas).
Or an S3 bucket where each conversation entry is appended to a single log file.
Database Option (Quick Outline)
Add an environment variable: DATABASE_URL.
Install an ORM like Prisma:
 npm install prisma
npx prisma init


Define a ConversationLog model in prisma/schema.prisma.
Migrate and connect to your DB on Railway or Heroku Postgres.
Insert each conversation piece (user message, LLM response, rating, etc.) as a row.
Read them for /api/logs.

8. Front-End Display & Rating
Logs Page


Fetch from GET /api/logs.
Display: user message, AI response, LLM used, rating, timestamp.
Next to each entry, a thumbs up/down button that calls POST /api/rate.
Rating Endpoint

 app.post('/api/rate', (req, res) => {
  const { id, rating } = req.body;
  // Find the log entry by ID, update rating, save to file or DB
  res.json({ success: true });
});



9. Deployment Considerations
Front End on Vercel


Link GitHub repo → Vercel.
Add NEXT_PUBLIC_BACKEND_URL in Vercel environment to point to your deployed backend.
Back End on Heroku or Railway


Make sure environment variables (LLM keys, DB credentials, Hume key, etc.) are set in the hosting platform’s “Config Vars.”
If using ephemeral logs, accept that logs may reset on dyno restarts.
If using DB, ensure you connect to it.
Check latencies:


Hume TTS calls, STT calls, LLM calls, Pinecone calls all add up. For an internal prototype with few users, it should be okay.

10. Final Testing Steps
Local Test:


Run backend locally (e.g., node server.js).
Run front end in dev mode (npm run dev).
Check Voice Input: record, get transcript.
Check Voice Output: AI’s response returns audio.
Test Multi-LLM: pick different LLMs, see logs reflect which was used.
Toggle system prompt (Friendly vs. Challenging), confirm difference in responses.
Deploy:


Deploy backend to Heroku / Railway.
Deploy front end to Vercel.
Update any environment variable references in the front-end code.
Confirm the entire flow works in production URLs.
Team Collaboration:


Have your 3 internal testers open the front end link, record voice, see logs, test rating, etc.
Confirm the logs appear for everyone.
If ephemeral logs are lost after a dyno sleep, consider the DB approach.

11. Optional Advanced Enhancements
Stream LLM / TTS: Partial streaming of text or audio for a more “real-time” feel.
Emotion Mirroring: Analyze user’s voice or text, adjust system prompt dynamically.
Automated Summaries: Summarize logs if they grow large, store condensed versions in Pinecone.
Analytics Dashboard: Track usage across multiple LLMs, success rates, average response time, etc.

Conclusion
By following this expanded checklist, you can implement:
Voice Input & Output with Hume (or other STT solutions).
Multi-LLM selection or random testing.
Dynamic System Prompts (friendly vs. challenging).
Logs (with potential thumbs up/down) that display in the UI.
A deployed environment on Vercel (front end) + Heroku/Railway (back end) that all 3 teammates can access.
You’ll have a robust AI Companion prototype that’s still relatively simple to build yet covers the full feature set (voice I/O, multi-LLM, dynamic prompts) you requested.

