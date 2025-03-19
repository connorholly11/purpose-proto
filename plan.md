Below is a **comprehensive Next.js-based plan** that covers **both** simple, short audio approaches (Whisper STT + TTS) **and** the **Realtime API** (WebRTC) for low-latency, streaming GPT-4o voice interactions. We’ll also integrate **Retrieval-Augmented Generation (RAG)** via **Pinecone** so the AI can reference external data, and optionally store conversation logs with **Prisma + Supabase**. Finally, we’ll discuss deploying on **Vercel**, including an **in-depth checklist** so any developer can implement the entire solution confidently.

---

# **AI Voice Companion Implementation Guide**

## **1. Overview of Features**

1. **Short Audio Flow** (STT + RAG + TTS):  
   - User records audio → short file upload → Whisper → Pinecone RAG → GPT-4o → TTS → playback.
   - Good for simpler voice queries, no real-time streaming.  

2. **Realtime Voice Flow** (WebRTC + GPT-4o Realtime):  
   - Continuous mic streaming → model transcribes and responds with low latency.  
   - Involves ephemeral tokens (so we don’t expose our main API key).  
   - Great for conversation-like experiences with partial transcripts, voice-activation detection (VAD), and immediate TTS output.

3. **RAG Integration** (OpenAI embeddings + Pinecone):
   - For knowledge grounding (docs, FAQs).  
   - GPT-4o references the retrieved data to produce accurate, context-aware answers.

4. **Prisma + Supabase** (Optional Logging):  
   - Store conversation logs if desired.  
   - Could store ephemeral usage data.  

5. **Deployment** on **Vercel** (or separate Heroku for the backend), environment variable management, etc.

---

## **2. Environment & Basic Project Setup**

### **2.1 Create the Next.js Project**

```bash
npx create-next-app my-ai-voice-companion
cd my-ai-voice-companion
```

*(If using the “pages” router, you’ll have `/pages/api/...` for server routes. If using the “app” router, you’ll have `/app/api/...`. The approach is nearly the same either way.)*

### **2.2 Install Dependencies**

```bash
npm install openai @pinecone-database/pinecone prisma @prisma/client formidable
# If you're doing realtime WebRTC in the browser, you may want "webrtc-adapter" for polyfills.
```

### **2.3 Environment Variables**

Create a local `.env.local` with your keys (not committed to GitHub):

```
OPENAI_API_KEY=<YOUR_OPENAI_KEY>
PINECONE_API_KEY=<YOUR_PINECONE_KEY>
PINECONE_ENVIRONMENT=<YOUR_PINECONE_ENV>
PINECONE_INDEX=<YOUR_INDEX_NAME>
DATABASE_URL=<YOUR_SUPABASE_OR_POSTGRES_URL>  # optional
```

- **OPENAI_API_KEY** must have GPT-4o, Whisper, TTS, Realtime Beta access.
- **PINECONE_API_KEY** for read-write on your index.
- **DATABASE_URL** if storing logs with Prisma + Supabase (optional).

---

## **3. RAG with Pinecone**

### **3.1 Pinecone Setup**

1. **Create** a Pinecone project and index:
   - Dimension = 1536 (for `text-embedding-ada-002`).
   - Metric = cosine (recommended).
2. **Store** the index name + environment in `.env.local`.

### **3.2 One-Time Document Embedding**

Make a script `scripts/ingest.ts` to chunk, embed, and upsert your knowledge base. Example:

```ts
// scripts/ingest.ts
import { Configuration, OpenAIApi } from "openai";
import { PineconeClient } from "@pinecone-database/pinecone";
import * as dotenv from "dotenv";

dotenv.config();

async function ingest() {
  const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));
  const pinecone = new PineconeClient();
  await pinecone.init({
    apiKey: process.env.PINECONE_API_KEY!,
    environment: process.env.PINECONE_ENVIRONMENT!
  });
  const index = pinecone.Index(process.env.PINECONE_INDEX!);

  const docs = [
    "Acme’s standard warranty lasts 60 days from purchase...",
    "Acme was founded by Wile E. Coyote in 1979..."
    // etc., chunk into ~500 tokens each
  ];
  
  const vectors = [];
  for (let i = 0; i < docs.length; i++) {
    const text = docs[i];
    const embRes = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: text
    });
    const emb = embRes.data.data[0].embedding;
    vectors.push({
      id: `doc-${i}`,
      values: emb,
      metadata: { text }
    });
  }
  
  await index.upsert({ upsertRequest: { vectors } });
  console.log("Pinecone ingestion complete!");
}

ingest().catch(console.error);
```

Run locally with `ts-node scripts/ingest.ts` or similar. Now Pinecone is ready for queries.

### **3.3 RAG Query Route in Next.js**

When the user has a text query (transcribed or typed), we:

1. **Embed** the query with `text-embedding-ada-002`.
2. **Search** Pinecone for top K matches.
3. **Combine** matches in GPT-4o prompt to produce an accurate, context-based answer.

**Example**: `app/api/rag/route.ts` (or `pages/api/rag.ts`):

```ts
import { NextApiRequest, NextApiResponse } from "next";
import { Configuration, OpenAIApi } from "openai";
import { PineconeClient } from "@pinecone-database/pinecone";

export default async function ragHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const { userQuery } = req.body;

    const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));
    const pinecone = new PineconeClient();
    await pinecone.init({
      apiKey: process.env.PINECONE_API_KEY!,
      environment: process.env.PINECONE_ENVIRONMENT!
    });
    const index = pinecone.Index(process.env.PINECONE_INDEX!);

    // 1) embed query
    const embedRes = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: userQuery
    });
    const queryVector = embedRes.data.data[0].embedding;

    // 2) Pinecone search
    const searchRes = await index.query({
      queryRequest: {
        vector: queryVector,
        topK: 5,
        includeMetadata: true,
      },
    });
    const context = (searchRes.matches || [])
      .map((m) => m.metadata?.text)
      .join("\n\n");

    // 3) GPT-4o with context
    const chatRes = await openai.createChatCompletion({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant. Use the context below to answer accurately." },
        { role: "user", content: `${userQuery}\n\nContext:\n${context}` }
      ]
    });
    const answer = chatRes.data.choices[0].message?.content;
    res.status(200).json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error in RAG query" });
  }
}
```

Now the front end can `POST /api/rag` with `{ userQuery }`.

---

## **4. Short Audio STT + TTS**

This section covers the simpler “upload short audio → get STT → do RAG → get TTS → playback” approach (non-streaming).

### **4.1 STT Endpoint**

Using **formidable** to parse an audio file:

```ts
import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import { Configuration, OpenAIApi } from "openai";

export const config = { api: { bodyParser: false } };

export default async function transcribeHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const form = formidable();
  form.parse(req, async (err, fields, files) => {
    try {
      const audioFile = files.audioFile; // <input name="audioFile" type="file" />
      const readStream = fs.createReadStream(audioFile.filepath);

      const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));
      const transcription = await openai.createTranscription(
        readStream,
        "whisper-1"
      );
      // transcription.data.text is the result
      res.status(200).json({ transcript: transcription.data.text });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to transcribe" });
    }
  });
}
```

### **4.2 TTS Endpoint**

```ts
import { NextApiRequest, NextApiResponse } from "next";
import { Configuration, OpenAIApi } from "openai";

export default async function ttsHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { text } = req.body;
    const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));
    const ttsResult = await openai.createSpeech({
      model: "tts-1",
      voice: "alloy",
      input: text
    });
    // Suppose the API returns audio bytes in a certain property
    // e.g. ttsResult.data.audioContent (base64 or binary)...

    // if it's base64:
    // res.status(200).json({ audio: ttsResult.data.audioContent });

    // or if it's binary:
    // res.setHeader("Content-Type", "audio/mpeg");
    // res.send(ttsResult.data);

    res.status(200).json({ success: true }); // Adjust for your real data
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "TTS Error" });
  }
}
```

### **4.3 Client Flow (Short Audio)**

1. **Record** short audio in the browser (using `MediaRecorder`) -> create a `FormData` with the file.  
2. **POST** to `/api/transcribe`.  
3. **Get** `transcript` from JSON response.  
4. **Call** `/api/rag` with `transcript` → get GPT-4o’s answer.  
5. **Call** `/api/tts` with GPT-4o answer → get audio (base64 or binary) → playback.

Example:

```ts
async function handleShortAudioFlow() {
  // 1. record ~10-30s audio
  // 2. upload to /api/transcribe
  const formData = new FormData();
  formData.append("audioFile", myAudioBlob);
  const sttRes = await fetch("/api/transcribe", { method: "POST", body: formData });
  const { transcript } = await sttRes.json();

  // 3. RAG
  const ragRes = await fetch("/api/rag", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userQuery: transcript })
  });
  const { answer } = await ragRes.json();

  // 4. TTS
  const ttsRes = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: answer })
  });
  const ttsData = await ttsRes.json(); // or arrayBuffer
  // play it
}
```

---

## **5. Real-Time Streaming (WebRTC) with GPT-4o Realtime**

Now for the advanced approach: **direct streaming** of voice in/out using the **Realtime API**.

### **5.1 Ephemeral Key Route**

We never expose our main `OPENAI_API_KEY` in the browser. Instead, we create ephemeral tokens on the server.

```ts
// /api/rt-session.ts
import { NextApiRequest, NextApiResponse } from "next";

export default async function ephemeralKeyHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const resp = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy", // or whichever voice
      })
    });
    const data = await resp.json();
    return res.status(200).json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to create ephemeral session" });
  }
}
```

### **5.2 Client-Side: WebRTC Setup**

```tsx
import { useState } from "react";

export default function RealtimeVoice() {
  const [status, setStatus] = useState("Idle");

  async function startRealtime() {
    try {
      setStatus("Requesting ephemeral token...");
      const tokenRes = await fetch("/api/rt-session");
      const tokenData = await tokenRes.json();
      const ephemeralKey = tokenData.client_secret.value;

      const pc = new RTCPeerConnection();
      // This audio element will play the model's output
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      pc.ontrack = (evt) => {
        audioEl.srcObject = evt.streams[0];
      };

      // local mic track
      setStatus("Requesting microphone...");
      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

      // data channel for sending/receiving JSON events
      const dc = pc.createDataChannel("oai-events");
      dc.onmessage = (evt) => {
        const data = JSON.parse(evt.data);
        console.log("Server event:", data);
        // e.g. partial transcripts, function calls, text deltas, etc.
      };

      setStatus("Creating local offer...");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      setStatus("Posting SDP to Realtime API...");
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const sdpRes = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp"
        },
        body: offer.sdp
      });
      const answerSDP = await sdpRes.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSDP });

      setStatus("Realtime connected!");
    } catch (err) {
      console.error(err);
      setStatus("Error connecting to Realtime");
    }
  }

  return (
    <div>
      <button onClick={startRealtime}>Connect Realtime GPT-4o</button>
      <p>Status: {status}</p>
    </div>
  );
}
```

### **5.3 RAG with Realtime**

If you want RAG while using streaming, you can:

1. **Listen** for partial transcripts from the data channel (e.g. `response.audio_transcript.delta`).  
2. **Send** that partial text to your Next.js route that queries Pinecone.  
3. **Inject** the returned context back into the Realtime model (via a “conversation.item.create” or “response.create” event with `input` referencing the snippet).  

This can get quite advanced. A simpler approach is to wait for a user “turn” to end (the model issues a `speech_stopped` event or partial transcripts finalize) and then do an external RAG call, injecting context for the next turn.

### **5.4 Additional VAD, Partial Transcripts, Etc.**

- The **Realtime** docs show how to handle `session.update` to turn on/off voice activity detection, or how to handle manual control.  
- You can also handle function calls, `response.text.delta` events, out-of-band responses, etc.

---

## **6. Prisma & Supabase (Optional)**

If you’d like to store logs:

1. `npx prisma init` → set `DATABASE_URL` in `.env.local`.  
2. `schema.prisma` example:

   ```prisma
   model User {
     id String @id @default(uuid())
     name String?
     conversations Conversation[]
   }

   model Conversation {
     id String @id @default(uuid())
     userId String?
     user User? @relation(fields: [userId], references: [id])
     createdAt DateTime @default(now())
     messages Message[]
   }

   model Message {
     id String @id @default(uuid())
     conversationId String
     role String // "user" | "assistant" | "function_call" etc.
     content String
     createdAt DateTime @default(now())
     conversation Conversation @relation(fields: [conversationId], references: [id])
   }
   ```

3. `npx prisma db push` or `prisma migrate dev`.  
4. In your routes or Realtime event handlers, you can call `await prisma.message.create(...)` to log interactions. This helps analyze user queries, store ephemeral session data, etc.

---

## **7. Deployment (Vercel)**

1. **Push** your Next.js project to GitHub.  
2. **Create** a new project on Vercel, link the repo.  
3. **Set** env vars in Vercel (OPENAI_API_KEY, PINECONE_API_KEY, etc.).  
4. **Deploy**.  
5. For ephemeral tokens (Realtime), your route `/api/rt-session` must quickly respond, or you risk timeouts (free plan has a ~10s–15s limit). Usually ephemeral token generation is fast, so it’s fine.  
6. If you do advanced real-time streaming with lots of concurrency, you may need to consider a persistent server, but for small prototypes, Vercel often works well.

---

## **8. Detailed Implementation Checklist**

Below is an **extensive** set of steps to ensure no detail is missed. You can follow them in order as a developer.

### **A. Basic Project Setup**

1. **Init Next.js**  
   - [ ] `npx create-next-app my-ai-voice-companion`  
   - [ ] `cd my-ai-voice-companion`

2. **Install** essential packages  
   - [ ] `npm install openai @pinecone-database/pinecone prisma @prisma/client formidable`

3. **Environment Variables**  
   - [ ] Create `.env.local` with keys:
     - `OPENAI_API_KEY`  
     - `PINECONE_API_KEY`, `PINECONE_ENVIRONMENT`, `PINECONE_INDEX`  
     - `DATABASE_URL` (optional)

### **B. (Optional) Prisma + Supabase**  

1. **Supabase**: create a new project in supabase.com or set up any Postgres.  
2. **Prisma init**  
   - [ ] `npx prisma init` → sets up `prisma/schema.prisma`.  
3. **Define** `Conversation`, `Message` (and optionally `User`).  
4. **Apply**: `npx prisma db push` or `prisma migrate dev`.  
5. **Test**: 
   ```ts
   import { PrismaClient } from "@prisma/client";
   const prisma = new PrismaClient();
   await prisma.conversation.create({ data: {} });
   ```

### **C. Pinecone & RAG**  

1. **Create** Pinecone index (dimension=1536).  
2. **Write** `scripts/ingest.ts`:
   - [ ] chunk doc text  
   - [ ] embed with `text-embedding-ada-002`  
   - [ ] upsert to Pinecone  
3. **Run**: `ts-node scripts/ingest.ts` (or `node scripts/ingest.js`).  
4. **Create** RAG route: `/api/rag`, which:
   - [ ] Takes user query  
   - [ ] Embeds with `text-embedding-ada-002`  
   - [ ] Queries Pinecone  
   - [ ] GPT-4o with retrieved context  
   - [ ] Returns final text  

### **D. Short Audio Mode**  

1. **STT**: `/api/transcribe` route
   - [ ] Use `formidable` to parse an audio file.  
   - [ ] `openai.createTranscription(fileStream, "whisper-1")` → get text.  
   - [ ] Return JSON with transcript.  
2. **TTS**: `/api/tts` route
   - [ ] `openai.createSpeech({ model:"tts-1", voice:"alloy", input: text })`  
   - [ ] Return base64 or binary.  
3. **Frontend**:
   - [ ] Record short audio with `MediaRecorder` → `FormData` → `/api/transcribe` → get transcript.  
   - [ ] `fetch("/api/rag", { body:{userQuery: transcript} })` → get GPT answer.  
   - [ ] `fetch("/api/tts",{ text: answer })` → get audio → play.  

### **E. Realtime API (WebRTC)**

1. **Ephemeral Session** route: `/api/rt-session`
   - [ ] Calls `https://api.openai.com/v1/realtime/sessions` with your `OPENAI_API_KEY`  
   - [ ] Returns ephemeral token  
2. **Frontend**:
   - [ ] React component that:
     - fetches ephemeral token from `/api/rt-session`  
     - creates `RTCPeerConnection`  
     - attaches mic track from `getUserMedia`  
     - data channel for sending/receiving JSON events  
     - does the SDP offer → `POST https://api.openai.com/v1/realtime?model=...` with ephemeralKey  
     - sets remote description from the returned answer  
   - [ ] Confirms model’s remote audio is playing.  
3. **Realtime RAG** (Optional):
   - [ ] Listen for partial transcript events or finalize speech.  
   - [ ] embed partial text or user’s last message → Pinecone → get context.  
   - [ ] send “session.update” or “conversation.item.create” with the snippet to the model if needed.  

### **F. Integration with Logging**  

1. **When** a user says something, you might do `prisma.message.create({role:"user", content: partialTranscript})`.  
2. **When** GPT or Realtime responds, you might do `prisma.message.create({role:"assistant", content: text})`.  
3. Optionally store ephemeral session tokens if you want usage tracking.

### **G. Deployment**  

1. **Push** your code to GitHub.  
2. **Vercel** → “New Project” → link repo.  
3. **Set** env vars in Vercel → `OPENAI_API_KEY`, etc.  
4. **Build** + **Deploy**.  
5. Test the short audio flow.  
6. Test ephemeral token route for Realtime.  
   - If ephemeral token route is slow (>10s), might risk serverless timeouts. Usually ephemeral token creation is quick enough.

### **H. Final Polishing**  

1. **Rate Limits**: GPT-4o and Whisper have usage caps. If you see 429 errors, consider retries or less concurrency.  
2. **Partial** or “live” transcripts for Realtime: feed them to Pinecone if you want mid-conversation RAG.  
3. **VAD** in Realtime: can be auto (session.turn_detection) or manual.  
4. **Function calling**: If you want advanced “tools” usage in Realtime, define them in `session.update` or `response.create`.

---

## **9. Master Implementation To-Do List (Extended)**

Here’s an even more **in-depth** list, ensuring no stone is left unturned:

1. **Project Initialization**  
   - [ ] `npx create-next-app my-ai-voice-companion`  
   - [ ] `cd my-ai-voice-companion`  
   - [ ] `npm install openai @pinecone-database/pinecone prisma @prisma/client formidable`  
   - [ ] `.env.local` with keys.  

2. **Pinecone & RAG**  
   - [ ] Create Pinecone index (dimension=1536, metric=cosine).  
   - [ ] `scripts/ingest.ts` to chunk docs + embed + upsert.  
   - [ ] `POST /api/rag`: embed user query, search Pinecone, GPT-4o with context.  

3. **Optional: Prisma + Supabase**  
   - [ ] `npx prisma init`  
   - [ ] Edit `prisma/schema.prisma`: define `Conversation`, `Message`.  
   - [ ] `npx prisma db push` or `migrate dev`.  
   - [ ] (Optional) log each user or AI message.  

4. **Short Audio Approach**  
   - **/api/transcribe**:
     - [ ] Use `formidable` to parse audio.  
     - [ ] `openai.createTranscription()` with `whisper-1`.  
   - **/api/tts**:
     - [ ] `openai.createSpeech({ model:"tts-1", voice:"alloy", input:text })`  
   - **Front End**:
     - [ ] Use `MediaRecorder` → short clip → upload form data → get transcript.  
     - [ ] Then call `/api/rag` + `/api/tts`.  

5. **Realtime API (WebRTC)**  
   - **/api/rt-session**:
     - [ ] `POST https://api.openai.com/v1/realtime/sessions` with your main key.  
     - [ ] Return ephemeral token to client.  
   - **Front End**:
     - [ ] React component to fetch ephemeral token.  
     - [ ] `RTCPeerConnection`, attach mic track.  
     - [ ] dataChannel “oai-events” for text events.  
     - [ ] offer → `POST https://api.openai.com/v1/realtime?model=...` with ephemeral key.  
     - [ ] setRemoteDescription from answer.  
     - [ ] confirm audio in/out.  
   - **Optional** RAG mid-session:
     - [ ] partial transcripts → embed + Pinecone → session.update or conversation.item.create with snippet.  

6. **Deployment**  
   - [ ] `git push` to GitHub.  
   - [ ] Link in Vercel → new project.  
   - [ ] Set environment vars in Vercel.  
   - [ ] Deploy → test.  
   - [ ] If ephemeral key route times out, consider a bigger plan or see if ephemeral calls are quick enough.  

7. **Testing & Validation**  
   - [ ] short audio: record, transcribe, rag, TTS.  
   - [ ] realtime: ephemeral token + live mic → model audio out.  
   - [ ] debug data channel events (partial transcripts, text deltas, etc.).  
   - [ ] optionally log everything in Supabase.  

8. **Possible Enhancements**  
   - [ ] **Function calls** in Realtime to handle external APIs.  
   - [ ] **Longer** conversation memory (store conversation or partial transcripts in Pinecone, re-embed).  
   - [ ] **UI** improvements: partial text streaming, “speaking” indicators, etc.  

---

## **10. Conclusion**

By following this plan, you’ll have:

- **RAG**-powered GPT-4o with your own documents (via Pinecone).  
- **Short-audio** fallback for quick voice queries.  
- **Fully streaming** real-time voice conversations using **WebRTC** + ephemeral token authentication, enabling near-instant transcriptions and TTS from GPT-4o Realtime.  
- Optional **Prisma + Supabase** integration for storing conversation logs, user data, or ephemeral usage stats.  
- A **robust** Next.js codebase that can be deployed to **Vercel**.

With this **in-depth** checklist, a developer can implement everything from scratch—embedding docs, short & real-time voice endpoints, ephemeral token usage, Realtime event handling, optional DB logging, and final deployment. Enjoy building your advanced **AI Voice Companion**!