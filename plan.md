Great, I'll conduct deep research to finalize all implementation details so a developer can immediately start coding without further research.

I'll gather:
- **API Key & .env Setup**: Exact format for OpenAI (GPT-4o, Whisper, TTS, Embeddings) and Pinecone, including necessary permissions and authentication.
- **Step-by-Step Implementation of RAG**:
  - Using OpenAI embeddings for **text-based RAG** with Pinecone.
  - Implementing **voice-based RAG**, ensuring embeddings properly integrate with the real-time voice system.
- **Specific OpenAI API Calls & Examples**:
  - Optimized API call structures for chat, STT, TTS, and embeddings.
  - Handling real-time TTS effectively (latency considerations, best practices).
- **Prisma & Supabase Integration**:
  - How to structure database schemas for logs, embeddings, and user interactions.
  - How to efficiently store and retrieve relevant context for RAG.
- **Deployment Considerations**:
  - Final Heroku setup guide (backend).
  - Final Vercel setup guide (frontend), handling CORS, API rate limits, and environment variables.

I will return with a full report outlining all necessary implementation details.

# AI Companion Prototype Implementation Guide

This guide provides a step-by-step implementation plan for building an AI companion with text and real-time voice capabilities using OpenAI GPT-4. It covers everything from configuring API keys to deploying the application, so you can proceed without additional research.

## 1. API Key & Environment Variables

Setting up the correct API keys and environment variables is the first step. You will need API credentials for OpenAI (for GPT-4, Whisper, Text-to-Speech, and Embeddings) and Pinecone. All sensitive keys should be stored in a `.env` file or platform-specific config to avoid exposing them in code.

- **OpenAI API Key:** After signing up at OpenAI and creating an API key, store it in your environment. For example, in a `.env` file add a line: `OPENAI_API_KEY=<your_openai_api_key>` ([OpenAI - Griptape Trade School](https://learn.griptape.ai/latest/setup/02_openai/#:~:text=1,Save%20the%20file)). This single key will be used for all OpenAI services (GPT-4 chat, Whisper STT, TTS, Embeddings).
- **OpenAI Organization (Optional):** If your account has an organization ID, you can set `OPENAI_ORG_ID=<your_org_id>`. This is not always needed for basic usage.
- **Pinecone API Key and Environment:** In your Pinecone account, retrieve your API key and the environment/region of your index (e.g., `us-west1-gcp`). Add these to the `.env` as `PINECONE_API_KEY=<your_pinecone_key>` and `PINECONE_ENVIRONMENT=<your_region>` ([pinecone-cli · PyPI](https://pypi.org/project/pinecone-cli/#:~:text=PINECONE_API_KEY%3D123456)). Pinecone uses the environment to know which region to connect to.
- **Pinecone Index Name:** Define an index name for your vector database (e.g., `PINECONE_INDEX=my-index-name`). You will use this when creating and querying the index. Storing it in an env variable makes it easy to change without altering code.
- **Supabase Database URL:** If using Supabase (which is a Postgres database) via Prisma, set the connection string. For example, `DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>` in the `.env`. You can find this in your Supabase project settings. Supabase also provides an anon/public API key, but for direct database access with Prisma, the `DATABASE_URL` suffices.
- **Supabase Service Key (Optional):** If you plan to call Supabase client APIs (instead of direct DB), you might need the `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (or anon key). For instance: `SUPABASE_URL=https://<your-project>.supabase.co` and `SUPABASE_SERVICE_ROLE_KEY=<service-role-key>`. These allow server-side insert/read if using Supabase client libraries.

**Required Permissions & Auth:** Ensure your API keys are active and have proper access:
  - The OpenAI key must have access to GPT-4 (which may require certain account status) and to Whisper and the TTS endpoint. OpenAI’s GPT-4 and associated APIs are typically accessible to paid accounts.
  - For Pinecone, use the Project default API key or a key with **read and write** permissions on your index (Pinecone’s keys can be scoped per project).
  - Supabase’s service role key (if used) should be kept secret (never expose it to the frontend) as it bypasses Row Level Security; otherwise use supabase's built-in auth for user-level data segregation.

In summary, an example **`.env` file** will contain:
```bash
OPENAI_API_KEY=<your_openai_api_key>
OPENAI_ORG_ID=<your_openai_org_id>   # (optional)
PINECONE_API_KEY=<your_pinecone_key>
PINECONE_ENVIRONMENT=<your_pinecone_env>
PINECONE_INDEX=<your_index_name>
DATABASE_URL=<your_supabase_postgres_url>
SUPABASE_URL=<your_supabase_project_url>
SUPABASE_SERVICE_ROLE_KEY=<your_supabase_service_key>
```

Make sure to **load these variables** in your application. For example, in Node/TypeScript, use a library like `dotenv` to load `.env`, or in Next.js/Vercel, configure them in the platform UI. This avoids hardcoding secrets in code ([How to use the OpenAI Text-to-Speech API | DataCamp](https://www.datacamp.com/tutorial/how-to-use-the-openai-text-to-speech-api#:~:text=Instead%2C%20we%20will%20use%20dotenv,file)) ([OpenAI - Griptape Trade School](https://learn.griptape.ai/latest/setup/02_openai/#:~:text=1,Save%20the%20file)).

## 2. Retrieval-Augmented Generation (RAG) Implementation

Retrieval-Augmented Generation will enable the AI companion to use external knowledge and past context, reducing hallucinations and improving accuracy. This involves using OpenAI’s embedding model with Pinecone’s vector database to store and fetch relevant information to include in GPT-4’s prompts.

**2.1 Setting up Pinecone and OpenAI Embeddings:**

- **Create a Pinecone Index:** Before indexing data, create a Pinecone index via their dashboard or API. Choose a dimension of `1536` for OpenAI’s `text-embedding-ada-002` embeddings (since each embedding vector from Ada v2 has length 1536). You can use the Pinecone Python client or REST API. For example, in Python: 
  ```python
  import pinecone
  pinecone.init(api_key=os.getenv("PINECONE_API_KEY"), environment=os.getenv("PINECONE_ENVIRONMENT"))
  pinecone.create_index(name="my-index", dimension=1536, metric="cosine")
  ```
  Ensure the index name matches your environment variable. Once created, you can connect to it with `index = pinecone.Index("my-index")`.
- **Prepare Your Knowledge Data:** Decide what info the assistant should have (FAQs, documents, etc.). Split large texts into chunks (e.g., paragraphs or sections ~500 tokens each) so that relevant pieces can be retrieved individually.
- **Generate Embeddings:** For each chunk of text, call OpenAI’s embedding API to get a vector. Using the OpenAI Python library, you could do: 
  ```python
  import openai
  openai.api_key = os.getenv("OPENAI_API_KEY")
  def get_embedding(text):
      response = openai.Embedding.create(model="text-embedding-ada-002", input=[text])
      embedding = response["data"][0]["embedding"]
      return embedding
  ```
  This function takes a text string and returns a 1536-dimensional embedding vector ([Leveraging Text Embeddings with the OpenAI API: A Practical Guide | DataCamp](https://www.datacamp.com/tutorial/introduction-to-text-embeddings-with-the-open-ai-api#:~:text=def%20get_embedding%28text_to_embed%29%3A%20,embedding)). (Batch processing is also supported by sending a list of texts in the `input` for efficiency.)
- **Upsert Embeddings into Pinecone:** As you generate embeddings for each piece of content, upsert them into the Pinecone index with an ID and optional metadata. For example:
  ```python
  # Assume data_chunks is a list of texts
  vectors = []
  for i, text in enumerate(data_chunks):
      vec = get_embedding(text)
      vectors.append((f"doc{i}", vec, {"text": text}))
  index.upsert(vectors=vectors)
  ``` 
  Here we store each vector with an ID like "doc0", "doc1", and attach the original text in metadata for retrieval ([Semantic Search with Pinecone and OpenAI | DataCamp](https://www.datacamp.com/tutorial/semantic-search-pinecone-openai#:~:text=index%20%3D%20pc,upsert%28batch)) ([Semantic Search with Pinecone and OpenAI | DataCamp](https://www.datacamp.com/tutorial/semantic-search-pinecone-openai#:~:text=openai)). Pinecone will index these vectors for similarity search. (If using Pinecone’s TypeScript client, the approach is similar: use your Pinecone environment and index, and call the upsert method with the vector data.)

**2.2 Integrating RAG into Conversations (Text & Voice):**

- **Embedding User Queries:** When a user asks a question (whether via text or voice), convert the query into an embedding using the same model. If the user spoke, first run Whisper to get the text (covered in Section 3). Then obtain the embedding of the transcribed text with `openai.Embedding.create(model="text-embedding-ada-002", input=[user_query_text])`. Let’s call this `query_vector`. Make sure to use the identical embedding model for both indexing and querying to ensure vector compatibility ([Semantic Search with Pinecone and OpenAI | DataCamp](https://www.datacamp.com/tutorial/semantic-search-pinecone-openai#:~:text=New%20data%20or%20queries%20need,queries%20using%20this%20identical%20model)) ([Semantic Search with Pinecone and OpenAI | DataCamp](https://www.datacamp.com/tutorial/semantic-search-pinecone-openai#:~:text=%60%5B0.014745471067726612%2C%20)).
- **Vector Search in Pinecone:** Query Pinecone for similar vectors. For example:
  ```python
  result = index.query(vector=query_vector, top_k=5, include_metadata=True)
  ```
  This finds the top 5 most relevant pieces of information related to the query ([Semantic Search with Pinecone and OpenAI | DataCamp](https://www.datacamp.com/tutorial/semantic-search-pinecone-openai#:~:text=query_result%20%3D%20index,query_result)). The `include_metadata=True` ensures we get back the stored text (or other metadata) along with IDs and similarity scores. The result will contain a list of matches (documents) that semantically relate to the user’s query.
- **Constructing the Prompt with Retrieved Context:** Take the returned relevant texts and incorporate them into the GPT-4 prompt. A common strategy is to prepend a system or assistant message that provides the retrieved context, or to formulate the user prompt like: _“User asks: {question}. Here are relevant details: {snippet1} ... {snippetN}. Based on this information, answer the question.”_ By injecting these snippets, GPT-4 can ground its answer in the provided context. For example:
  ```javascript
  const messages = [
    { role: "system", content: "You are a helpful assistant. Use the provided context to answer the user's question truthfully." },
    { role: "user", content: `${userQuery}\n\nContext:\n${snippet1}\n${snippet2}` }
  ];
  const completion = await openai.createChatCompletion({ model: "gpt-4", messages });
  ```
  Each `snippet` is one of the retrieved texts. (Ensure the combined prompt stays within GPT-4’s token limit, trimming or summarizing context if necessary.)
- **Handling Voice Interaction:** In real-time voice use, the flow remains similar with added audio steps. The pipeline will be:
  1. **Speech-to-text**: Use Whisper to transcribe the user’s speech to text.
  2. **Retrieve context**: Embed the transcribed text and query Pinecone for relevant info.
  3. **LLM response**: Send the conversation history along with retrieved context to GPT-4 to get a response.
  4. **Text-to-speech**: Convert GPT-4’s text answer to audio and play it back to the user.
  
  This means the RAG process (steps 2 and 3) happens in between the input and output audio. The retrieved context essentially augments the conversation before the model responds. By injecting context this way, Retrieval-Augmented Generation _“uses semantic search to retrieve relevant and timely context that LLMs use to produce more accurate responses”_ ([Retrieval Augmented Generation (RAG) | Pinecone](https://www.pinecone.io/learn/retrieval-augmented-generation/#:~:text=Image%3A%20Retrieval%20Augmented%20Generation%20,search%20to%20retrieve%20relevant%20context)) ([Retrieval Augmented Generation (RAG) | Pinecone](https://www.pinecone.io/learn/retrieval-augmented-generation/#:~:text=You%20send%20these%20embeddings%20to,to%20perform%20its%20generative%20task)). The result is that the model’s answer will reference the supplied facts, greatly reducing hallucinations.

- **Efficiency Considerations:** To keep retrieval fast in real-time interactions, limit the scope of vector search if possible:
  - Use metadata filters in Pinecone if your data is categorized (e.g., restrict by topic or by a user profile ID for personal knowledge).
  - Store a moderate number of documents (thousands, not millions) or use Pinecone’s filtering to narrow search, so queries stay under ~100ms. Pinecone is designed for low-latency search on large vector sets ([Semantic Search with Pinecone and OpenAI | DataCamp](https://www.datacamp.com/tutorial/semantic-search-pinecone-openai#:~:text=match%20at%20L356%20%2A%20Real,for%20applications%20requiring%20immediate%20responses)) ([Semantic Search with Pinecone and OpenAI | DataCamp](https://www.datacamp.com/tutorial/semantic-search-pinecone-openai#:~:text=%2A%20Real,for%20applications%20requiring%20immediate%20responses)), but network overhead also matters.
  - Since embedding the user query is very quick (it’s a single API call to OpenAI), the slowest step in RAG is usually the GPT-4 completion itself. Ensure retrieval is done in parallel with any other preparations to minimize added delay. For instance, you can start the Pinecone query as soon as the Whisper transcription is available, possibly while you format conversation context for the prompt.
  
By following these steps, any response the companion gives can be “augmented” with relevant knowledge. In summary, RAG works as: **Transcribe voice -> Embed text -> Vector search -> Inject results -> GPT-4 generates answer**. The architecture below illustrates how context is retrieved from a vector DB and fed into the LLM’s input to produce a grounded answer:

 ([Retrieval Augmented Generation (RAG) | Pinecone](https://www.pinecone.io/learn/retrieval-augmented-generation/)) *Retrieval-Augmented Generation pipeline: the user’s query is embedded and matched against a Pinecone vector database to fetch relevant context, which is then provided to the GPT-4 model to generate a reliable answer ([Retrieval Augmented Generation (RAG) | Pinecone](https://www.pinecone.io/learn/retrieval-augmented-generation/#:~:text=Image%3A%20Retrieval%20Augmented%20Generation%20,search%20to%20retrieve%20relevant%20context)) ([Retrieval Augmented Generation (RAG) | Pinecone](https://www.pinecone.io/learn/retrieval-augmented-generation/#:~:text=You%20send%20these%20embeddings%20to,to%20perform%20its%20generative%20task)).*

## 3. OpenAI API Calls & Examples (Chat, STT, TTS, Embeddings)

With keys and RAG in place, you’ll integrate specific OpenAI API calls. The companion will use multiple OpenAI services: Chat Completions for GPT-4, Whisper for speech-to-text (STT), the Text-to-Speech API for voice output (TTS), and the Embeddings API. Below are best practices and code examples for each:

**3.1 Chat Completions (GPT-4):** Use the OpenAI Chat API to converse with GPT-4. The endpoint is `/v1/chat/completions`. Construct the `messages` array with the conversation history and any system instructions. For example (using Node.js pseudocode):
```javascript
const openai = new OpenAIApi({ apiKey: process.env.OPENAI_API_KEY });
const messages = [
  { role: "system", content: "You are a friendly AI companion embedded in a voice assistant." },
  { role: "user", content: "Hello! Can you tell me a fun fact about space?" }
];
const response = await openai.createChatCompletion({
  model: "gpt-4",
  messages: messages,
  temperature: 0.7
});
const assistantReply = response.data.choices[0].message.content;
```
This sends a user prompt to GPT-4 and receives the assistant’s reply. **Streaming:** For real-time feel, enable streaming of the completion by setting `stream: true` in the API call. In Node, you’d handle the stream events (or in Python, iterate over the event generator). Streaming allows you to start processing (or even speaking) the response before the full text is available, cutting down perceived latency.

**Latency optimization for chat:** Keep messages concise – the entire prompt (system + recent conversation + context) should be as short as possible while containing necessary info. You might **limit the chat history** sent to GPT-4 (e.g., the last N interactions) to avoid hitting token limits and to reduce API processing time. Another technique is to use **functions or tools** if using OpenAI function calling (not explicitly required here, but sometimes helpful to offload certain tasks). However, since the question is about direct implementation, the main considerations are prompt size and streaming.

**3.2 Speech-to-Text (Whisper API):** OpenAI’s Whisper API (`/v1/audio/transcriptions`) will convert user speech to text. You’ll send audio and get back a transcript. Basic usage in Python:
```python
import openai
openai.api_key = OPENAI_API_KEY
audio_file = open("path/to/user_recording.wav", "rb")
transcript = openai.Audio.transcribe(
    file=audio_file,
    model="whisper-1",
    response_format="text",
    language="en"
)
print(transcript)
``` 
This example opens an audio file and transcribes it to English text ([Speech to Text Made Easy with the OpenAI Whisper API | DataCamp](https://www.datacamp.com/tutorial/converting-speech-to-text-with-the-openAI-whisper-API#:~:text=import%20openai)). In practice, your frontend will capture audio (e.g., via the Web Media API) and send it to your backend (perhaps as a WAV or MP3 blob). The backend then calls `openai.Audio.transcribe` with that binary data. The `model` "whisper-1" is the default large-v2 Whisper model. You can set `language` explicitly if you know it, which can improve accuracy. The API can handle up to ~25-30 seconds of audio per request ([How to use whisper to handle long video? - OpenAI Developer Forum](https://community.openai.com/t/how-to-use-whisper-to-handle-long-video/530862#:~:text=How%20to%20use%20whisper%20to,to%20use%20as%20python%20module)) – if you need longer, you should chunk the audio or use a streaming approach (OpenAI’s Whisper API itself doesn’t stream, so you’d have to implement chunking and partial transcription logic if needed).

OpenAI Whisper will return the recognized text string. On success, use this transcript as the user’s query for downstream steps. Whisper’s accuracy is state-of-the-art, so you typically don’t need a backup STT. If the audio has low clarity, consider capturing at a good sample rate (16kHz or 24kHz) and using a noise suppression if available on the client side.

**3.3 Text-to-Speech (TTS API):** OpenAI offers a TTS endpoint (`/v1/audio/speech`) that can generate natural voice audio from text. You can choose from several built-in voices (e.g., “alloy”, “ash”, “echo”, etc.) and two model qualities (`tts-1` for real-time optimized, `tts-1-hd` for high-definition) ([TTS API | OpenAI Help Center](https://help.openai.com/en/articles/8555505-tts-api#:~:text=With%20the%20text,not%20tokens)) ([TTS API | OpenAI Help Center](https://help.openai.com/en/articles/8555505-tts-api#:~:text=from%20text,not%20tokens)). For real-time interaction, `tts-1` is recommended for speed. Example usage in Python:
```python
from openai import OpenAI
client = OpenAI(api_key=OPENAI_API_KEY)
response = client.audio.speech.create(
    model="tts-1",
    voice="alloy",  # one of the voice names
    input="Sure, here is an interesting fact about space..."
)
# Save the audio to a file (or stream it directly to response in a web app)
with open("response_audio.mp3", "wb") as f:
    response.write_to_file(f)
```
This code uses OpenAI’s Python SDK which allows streaming the result to a file ([How to use the OpenAI Text-to-Speech API | DataCamp](https://www.datacamp.com/tutorial/how-to-use-the-openai-text-to-speech-api#:~:text=speech_file_path%20%3D%20Path%28__file__%29.parent%20%2F%20,)) ([How to use the OpenAI Text-to-Speech API | DataCamp](https://www.datacamp.com/tutorial/how-to-use-the-openai-text-to-speech-api#:~:text=speech_file_path%20%3D%20Path%28__file__%29.parent%20%2F%20,)). In a Node environment, you would call the REST endpoint or use an SDK if available, then get the binary audio data (likely in MPEG or WAV format). The key parameters are the model and voice. 

**Real-time considerations for TTS:** To minimize delay, use `model="tts-1"` (faster, lower latency) ([TTS API | OpenAI Help Center](https://help.openai.com/en/articles/8555505-tts-api#:~:text=With%20the%20text,not%20tokens)). Additionally, you can stream the audio chunks as they are generated by setting `stream=True` in the request ([TTS API | OpenAI Help Center](https://help.openai.com/en/articles/8555505-tts-api#:~:text=Is%20it%20possible%20to%20stream,audio)). This means the API will start sending audio data as soon as it begins speaking, rather than waiting until the entire sentence is done. Your server can then forward these audio bytes to the client for immediate playback (the client would need to handle streaming audio playback). If implementing streaming audio is complex, an alternative is to fetch the whole MP3 and then play it, which is simpler but incurs a few seconds of wait for longer responses. For a prototype, many developers start with non-streamed TTS (simpler integration) and then optimize to streaming once basic functionality works.

OpenAI’s voices are quite natural, and using the same provider for STT and TTS ensures the overall pipeline stays within one ecosystem. The **audio input and output can even be handled in one step** with OpenAI’s newer APIs. In fact, OpenAI’s **Chat Completions API now supports audio inputs/outputs** (and a Realtime API for true streaming) ([Introducing the Realtime API | OpenAI](https://openai.com/index/introducing-the-realtime-api/#:~:text=to%20ChatGPT%E2%80%99s%20Advanced%20Voice%20Mode%2C,already%20supported%20in%20the%20API)) ([Introducing the Realtime API | OpenAI](https://openai.com/index/introducing-the-realtime-api/#:~:text=How%20it%20works)). However, for clarity and control, we’re using separate calls for Whisper, GPT-4, and TTS in this guide (which mirrors the approach many implementations took before the combined API was released). Do note that the old approach of stitching Whisper -> GPT -> TTS “often resulted in loss of emotion... plus noticeable latency” ([Introducing the Realtime API | OpenAI](https://openai.com/index/introducing-the-realtime-api/#:~:text=Previously%2C%20to%20create%20a%20similar,and%20outputs%20directly%2C%20enabling%20more)). The tips above (streaming and using fast models) aim to mitigate that latency.

**3.4 Embeddings API (for RAG and beyond):** We already covered usage in the RAG section, but to reiterate key points: use the `text-embedding-ada-002` model for generating embeddings ([OpenAI - Pinecone Docs](https://docs.pinecone.io/integrations/openai#:~:text=LLMs%20like%20OpenAI%E2%80%99s%20%60text,information%20provided%20from%20these%20contexts)). Each call can handle up to 16 inputs (per documentation) – you can embed multiple pieces of text by passing an array of strings to `openai.Embedding.create`. The result will have an entry for each input in `response["data"]`. Always use the same model for generating query embeddings as was used for indexing the knowledge base. The OpenAI embedding API is quite fast (~100 milliseconds for a single short text) and cost-effective, so it won’t be a bottleneck.

**Example (Node.js) using fetch:** If you prefer direct HTTP calls instead of OpenAI’s SDKs, you can use fetch/axios:
```javascript
const embeddingRes = await fetch("https://api.openai.com/v1/embeddings", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
  },
  body: JSON.stringify({ model: "text-embedding-ada-002", input: userQuery })
});
const data = await embeddingRes.json();
const vector = data.data[0].embedding;
```
Then send `vector` to Pinecone query endpoint similarly.

**Handling Rate Limits:** OpenAI imposes rate limits on each API (e.g., Whisper may have ~50 requests/minute for paid users, GPT-4 might have throughput limits). If your companion app will be used heavily, implement checks or backoff. Monitor response headers from OpenAI; if you get a `429 Too Many Requests`, you may need to slow down or request rate limit increases. Pinecone also has QPS limits depending on your pod size. In a prototype, you likely won’t hit these limits, but keep an eye on it during testing. If needed, queue up requests or introduce short delays/retries when the API signals to do so.

To summarize this section: **use the OpenAI SDKs or HTTP APIs to perform each task** – transcribe audio with Whisper, fetch relevant info via embeddings and Pinecone, get GPT-4’s answer via chat completion, and synthesize voice with TTS. Optimize by streaming both the GPT-4 output text and the TTS audio so the user hears the response with minimal delay.

## 4. Prisma & Supabase Integration

In addition to the OpenAI and Pinecone components, you will need a database to store conversation data, user info, and possibly embeddings metadata. This guide assumes using **Supabase (Postgres) with Prisma** as the ORM. Supabase will serve as a persistent memory for conversations and other state, while Pinecone is used for vector search.

**4.1 Database Schema Design:**

Design your schema to capture chat history and any other relevant data:
- **Users Table:** If your app supports multiple users, have a `User` table (with `id`, `name`, etc.). Each user can have many conversations.
- **Conversations Table:** Each conversation (dialog session) should have an `id` (UUID), a reference to the user (user_id), and maybe a timestamp for when it started. A conversation “session-token” or ID is used to group messages ([Chat History in Supabase? : r/LangChain](https://www.reddit.com/r/LangChain/comments/14l6a4n/chat_history_in_supabase/#:~:text=Yes%20we%20store%20our%20chat,tokens%22%20in%20supabase)). For example: `id (uuid) | user_id (uuid) | created_at (timestamp)`.
- **Messages Table:** Store each message in a conversation. Fields might include: `id (uuid)`, `conversation_id` (UUID reference), `sender` (text or enum: “user” or “assistant” or even “system”), `content` (text, the message content), and `timestamp`. You might also include columns for additional data like `role` (to distinguish system messages) or function call info, but for a basic prototype user/assistant roles suffice.
- **Embeddings Table (optional):** If you want to store long-term memory or document knowledge in the database as well (in addition to Pinecone), you could have a table with `id`, `content` (text), and `embedding` (vector). However, storing 1536-dimension vectors in Postgres is heavy. A better approach is to store such data in Pinecone only, and perhaps keep just a reference or short summary in Postgres if needed. Supabase does support vector types via an extension if you wanted to explore that later, but Pinecone is already handling it for us.
- **Example Prisma Schema:** 
  ```prisma
  model User {
    id        String   @id @default(uuid())
    name      String?
    conversations Conversation[]
  }

  model Conversation {
    id        String    @id @default(uuid())
    user      User?     @relation(fields: [userId], references: [id])
    userId    String?
    createdAt DateTime  @default(now())
    messages  Message[]
  }

  model Message {
    id         String   @id @default(uuid())
    conversation Conversation @relation(fields: [conversationId], references: [id])
    conversationId String
    role       String   // "user" or "assistant"
    content    String
    createdAt  DateTime @default(now())
  }
  ```
  This is a simple schema where each message belongs to a conversation, and a conversation belongs to a user. In practice, you might also store `assistantReplyAudioURL` if you cache the audio file, or other fields like `is_voice` to mark if a message came via voice. Adjust the schema based on what data you need to persist.

- The **rationale** for storing messages: it allows you to display past chats to the user, analyze conversations, or even feed long-term history back into the model if needed. Supabase (Postgres) can easily store thousands of messages and let you query or filter them. By using a `conversation_id` (session token) to group them, you can handle concurrent sessions for many users without mix-up ([Chat History in Supabase? : r/LangChain](https://www.reddit.com/r/LangChain/comments/14l6a4n/chat_history_in_supabase/#:~:text=Yes%20we%20store%20our%20chat,tokens%22%20in%20supabase)).

**4.2 Using Prisma to Interact with Supabase:**

- **Prisma setup:** Initialize Prisma in your project (`npx prisma init`), which will create a `.env` (we already have) and a `schema.prisma`. Point the datasource to the Supabase `DATABASE_URL`. After defining your models (like above), run `npx prisma db push` (or migrate) to apply the schema to Supabase.
- **Recording Conversations:** Each time the user says something or the assistant responds, insert a Message row. For example, after Whisper transcribes input, you might do:
  ```typescript
  await prisma.message.create({
    data: { conversationId: currentConversationId, role: "user", content: transcript }
  });
  ```
  and after GPT-4 produces an answer:
  ```typescript
  await prisma.message.create({
    data: { conversationId: currentConversationId, role: "assistant", content: assistantReply }
  });
  ```
  If starting a new conversation, first create the Conversation entry (with the associated user ID).
- **Embedding Logs (optional):** If you plan to implement long-term memory where the assistant can recall something said much earlier, you could embed each user message and store it. This could be done by adding an `embedding` field to the Message model (as a float array or separate table). However, querying that in Postgres for similarity is non-trivial without vector extension. A simpler approach: use Pinecone for long-term memory as well – you could upsert each user message embedding into a separate Pinecone index (or the same index with a different namespace) so you can do semantic searches over past dialogues. This is an advanced feature; initially, you can just fetch recent messages from the DB for context.
- **Querying for Context:** To retrieve conversation history when a user speaks again, query the Message table for that conversation, sorted by createdAt. You might take the last 5-10 messages (both user and assistant) to include as context in the prompt. For example:
  ```typescript
  const recentMessages = await prisma.message.findMany({
    where: { conversationId: currentConversationId },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  // then format recentMessages into the messages array for OpenAI
  ```
  This ensures continuity in the conversation (the model remembers what was just discussed). Storing and retrieving chat history from the database means you don’t rely on the client to send back all prior messages every time – the server can assemble the history as needed.

**4.3 Supabase Edge Cases:** Supabase is a managed Postgres; if using the Supabase JavaScript client in a browser, you’d normally use an `anon` key and RLS for security. In our architecture, however, the conversation logging is done on the backend (which trusts the user after authentication). So using Prisma with the direct DB URL is fine. Just be sure to keep that DB URL secret. Also, be mindful of text sizes – a `content` field of type `text` can hold lengthy conversation turns, but extremely large content (like entire documents) might be better stored in a separate table or cloud storage if needed. For typical chat, this is not an issue.

By integrating Prisma, you get a type-safe way to interact with Supabase. Supabase + Prisma essentially gives you a cloud SQL database for persistent data. In this system, Pinecone handles semantic searches (for RAG and possibly long-term memory), whereas Supabase stores the exact transcripts and interactions. Both are important: Pinecone gives intelligence and context retrieval, while the database provides record-keeping and state.

## 5. Deployment Considerations

Finally, let’s address deploying the AI companion. We have a backend (likely a Node.js/Express or Python FastAPI server) and a frontend (perhaps a React or Next.js application). The goal is to deploy the backend on **Heroku** and the frontend on **Vercel**. We also must handle cross-origin issues, rate limits, and performance optimizations in production.

**5.1 Deploying the Backend on Heroku (Step-by-Step):**

- **Prepare your app for Heroku:** Ensure your server has a proper start script in `package.json` (if Node) and listens on the port specified by `process.env.PORT`. Heroku will set a PORT env var for you. For Python, ensure a `Procfile` with something like `web: uvicorn main:app` (if using FastAPI) is present.
- **Heroku Project Setup:** Install the Heroku CLI and log in, or use Heroku’s web dashboard. Create a new app (e.g., `heroku create my-voice-ai` via CLI).
- **Set Environment Variables:** On Heroku, you don’t include the `.env` file. Instead, configure the config vars on the platform. Using CLI you can do:
  ```bash
  heroku config:set OPENAI_API_KEY=<your_key> PINECONE_API_KEY=<your_key> ... 
  ```
  for all the variables. For example, one command per variable or a single command listing multiple key=value pairs ([Easy Deployment to Heroku - step by step (Node & Vue app) - DEV Community](https://dev.to/kristof92/how-to-deploy-a-mevn-app-to-heroku-step-by-step-571g#:~:text=Now%20you%20should%20add%20your,it%20has%20any%20single%20characters)). Alternatively, in the Heroku dashboard, go to your app’s Settings -> Config Vars and add each key-value pair.
- **Deploy Code:** Push your code to Heroku. If you linked a GitHub repo, you can enable automatic deploys. If using CLI, do `git push heroku main`. Heroku will detect your language (Node.js, etc.) and build accordingly. 
- **Scale dynos:** Ensure at least one web dyno is running (Heroku usually does this by default after first deploy). You can scale via `heroku ps:scale web=1`.
- **Check Logs:** Use `heroku logs --tail` to see the live logs and verify the server starts properly without errors ([Easy Deployment to Heroku - step by step (Node & Vue app) - DEV Community](https://dev.to/kristof92/how-to-deploy-a-mevn-app-to-heroku-step-by-step-571g#:~:text=When%20it%27s%20all%20good%2C%20issue,and%20it%27s%20all%20done)). Common pitfalls: forgetting to use `process.env.PORT` (Heroku will error if your app binds to the wrong port), or missing build packs for things like FFmpeg if needed for audio processing (though for our usage, we send raw audio to OpenAI, so we may not need FFmpeg).
- **CORS on Backend:** Since your frontend is served from a different domain (e.g., Vercel domain), enable CORS on the server. In an Express.js app, install the `cors` middleware and use it:
  ```javascript
  const cors = require('cors');
  app.use(cors({ origin: 'https://<your-vercel-app>.vercel.app' }));
  ```
  This will allow the frontend origin to make requests to the backend. You can allow all origins during development (`app.use(cors())` which enables CORS for all) ([Express cors middleware](https://expressjs.com/en/resources/middleware/cors.html#:~:text=app)), but in production it’s safer to specify your domain. Don’t forget to allow HTTP methods you need (GET/POST) and perhaps credentials if using auth.
- **Heroku Specifics:** Heroku free tier (if still available) may sleep your dyno, causing cold starts. If using a hobby/pro tier, this is less an issue. Cold starts on a voice assistant might cause the first request after a sleep to have extra latency. If needed, use a cron or external ping to keep it awake, or upgrade the tier.

**5.2 Deploying the Frontend on Vercel:**

- **Framework Setup:** If your frontend is a Next.js app (common on Vercel) or any React app, ensure it runs correctly locally and is connected to your backend URL (update API fetch URLs to point to the Heroku app, e.g., `https://my-voice-ai.herokuapp.com/api/...`).
- **Environment Variables:** In Vercel, set the necessary env vars for the frontend. Likely the frontend only needs the backend URL and maybe some config flags (you should **not** expose any private keys to the frontend). Go to your Vercel project settings -> Environment Variables, and add entries for each variable your front end expects (for example, an `NEXT_PUBLIC_API_URL` with the Heroku backend URL). The names must match those used in your code. Vercel allows you to configure these per environment (development, preview, production) ([How to properly set environment variables in Next.js app deployed ...](https://stackoverflow.com/questions/66293848/how-to-properly-set-environment-variables-in-next-js-app-deployed-to-vercel#:~:text=How%20to%20properly%20set%20environment,local)).
- **Deploy Process:** If your project is on GitHub, Vercel can auto-deploy on pushes. Just import the repo on Vercel and set up the project. It will detect the framework (Next.js, Create React App, etc.) and build accordingly. On successful build, it will assign a domain like `yourproject.vercel.app`.
- **Testing:** Once deployed, test that the frontend can communicate with the backend. Open the web app and attempt a conversation. If you see CORS errors in the browser console (e.g., *“Access-Control-Allow-Origin”* issues), double-check the CORS config on the server and that the correct domain is allowed. Also ensure the requests from the front end are going to the correct URL (sometimes an issue if using relative paths vs full URL).
- **Custom Domain (Optional):** If desired, set up a custom domain on Vercel for a more polished experience, but that’s not required for functionality.

**5.3 Performance & Rate Limit Management:**

- **OpenAI Rate Limits:** As mentioned, keep an eye on how frequently you call the OpenAI APIs. For a single-user prototype, you’ll be well under the limits. If scaling to many users, implement a mechanism to queue or limit concurrent requests. OpenAI’s documentation or the response headers will indicate if you approach the limit (e.g., `X-RateLimit-Remaining`). In a Node backend, you might use a library or simple in-memory counters to throttle if needed.
- **Parallelize Non-Dependent Tasks:** You can overlap certain operations to reduce overall latency. For instance, while you are waiting for the Pinecone search to return, you could already start composing the prompt with known parts (like the recent conversation). Or if you choose to stream GPT-4’s answer, you can begin the TTS as soon as the first chunk of text arrives. These optimizations can get complex, but even basic parallelism can shave off seconds.
- **Caching:** Consider caching frequent responses or embeddings. If your companion often receives the same question, you could cache the answer or at least the Pinecone result for that question to reuse. Similarly, cache embeddings for identical texts so you don’t recompute them. At a small scale this isn’t crucial, but it’s a good practice to avoid redundant work (you can use an in-memory cache or a fast key-value store).
- **Error Handling:** Be sure to handle API errors gracefully. For example, if the OpenAI API is unreachable or returns an error, your server should catch that and perhaps return a friendly message like “Sorry, I’m having trouble thinking right now.” Similarly, handle cases where Pinecone returns no results (e.g., if the question is completely unrelated to any indexed context, GPT-4 should still try to answer on its own).
- **Security:** Never expose your API keys on the client side. Our design keeps all secret calls on the backend, which is good. Also, consider limiting the size or duration of user inputs to prevent abuse (for instance, don’t allow a user to upload an hour-long audio to transcribe as it could consume a lot of tokens or time).
- **Scaling Considerations:** Heroku can scale vertically (bigger dynos) or horizontally (multiple dynos) if needed. Pinecone can scale by choosing a larger pod type for more queries per second. OpenAI’s API can be scaled by request – you might need to request rate limit increases or, if extremely large scale, consider batching requests for efficiency.

**5.4 CORS and Networking:** We touched on CORS – ensure the backend’s CORS policy allows the Vercel domain. Also, if you encounter any TLS/SSL issues, note that both Heroku and Vercel provide HTTPS by default on their domains. So your fetch calls should use `https://`, not `http://`. In a browser context, insecure requests will be blocked if your site is served over HTTPS.

With deployment in place, your AI companion should be live and accessible. The user flow will be:
1. User speaks into the frontend (browser).
2. The frontend records audio and sends it to your Heroku backend (via an API endpoint).
3. Backend receives audio, calls Whisper (OpenAI) to transcribe.
4. Backend optionally stores the user message in the database, then calls Pinecone to get related context (using OpenAI embeddings).
5. Backend constructs the prompt with context + conversation history and calls OpenAI Chat API (GPT-4) to generate a reply.
6. Backend stores the assistant reply in the DB, then calls OpenAI TTS to synthesize the reply audio.
7. Backend streams or sends the audio file back to the frontend.
8. Frontend plays the audio for the user and perhaps displays the text on screen.

Throughout this process, make sure to log key events (but not sensitive data) so you can debug if something fails in the chain. Each step involves external APIs, so having logging around API calls and responses (at least statuses) helps isolate issues.

Finally, keep an eye on cost: GPT-4 is expensive per call, and real-time usage with Whisper and TTS adds up. For a prototype, use smaller prompts and maybe limit the number of interactions to stay within a free trial or budget. If needed, you can switch to GPT-3.5-turbo for less critical conversations to save cost, or use Whisper’s smallest model locally to avoid API calls. But these are optimizations beyond the initial prototype.

By following this guide, you should be able to implement a fully functional AI companion that hears, thinks, and speaks. It covers configuration of keys, integration of RAG for knowledge retrieval, correct usage of OpenAI’s APIs, data persistence with Supabase, and deployment steps for both backend and frontend. With all these pieces in place, you can focus on fine-tuning the conversation experience and behavior of your AI companion rather than worrying about the infrastructure.

