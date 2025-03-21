# Real-Time Voice Feature Reference

This document provides reference information about the real-time voice feature that has been temporarily commented out. This can be used for future reimplementation.

## Overview

The real-time voice feature provides a WebRTC-based interface for real-time voice conversations with the AI. It uses OpenAI's real-time API to stream audio and transcriptions bidirectionally.

## Components and Files

### Main Components

1. **RealtimeVoice.tsx**
   - Main component handling WebRTC connections
   - Manages audio streaming, transcription, and responses
   - Located at `src/app/components/RealtimeVoice.tsx`

### Integration Points

1. **ChatInterface.tsx**
   - Integration point for the real-time voice feature
   - Button to activate the feature (green button with pulsing microphone icon)
   - Handlers for transcripts and responses

## Commented Code Sections

### In ChatInterface.tsx

1. **State variables**
   ```tsx
   const [showRealtimeVoice, setShowRealtimeVoice] = useState(false);
   const [realtimeTranscript, setRealtimeTranscript] = useState<string | null>(null);
   ```

2. **Handler functions**
   ```tsx
   // partial transcripts from Realtime
   const handlePartialTranscript = (transcript: string) => {
     setRealtimeTranscript(transcript);
   };

   // handle final transcript from Realtime voice
   const handleRealtimeUserMessage = async (transcript: string) => {
     console.log(`📝 CHAT RECEIVED FINAL TRANSCRIPT: "${transcript}"`);
     console.log(`🔍 DEBUG - conversationId: ${conversationId || 'undefined'}`);
     
     if (!transcript.trim() || !conversationId) {
       console.log('⚠️ Empty transcript or missing conversationId - skipping processing');
       return;
     }

     console.log('✏️ Adding user message to conversation');
     // Add user message to local state
     const newUserMessage: MessageType = {
       id: `realtime-${Date.now()}`,
       conversationId,
       role: 'user',
       content: transcript.trim(),
       createdAt: new Date(),
     };
     setMessages(prev => [...prev, newUserMessage]);
     setRealtimeTranscript(null);

     setIsProcessing(true);
     try {
       // 1) RAG with transcript
       console.log('🔍 STARTING RAG RETRIEVAL for transcript...');
       console.log('🔄 Making request to /api/rag-service with transcript:', transcript.trim());
       const ragRes = await fetch('/api/rag-service', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           query: transcript.trim(),
           topK: 5,
           source: 'realtime_voice',
           conversationId
         }),
       });
       if (!ragRes.ok) {
         console.error(`❌ RAG processing failed with status: ${ragRes.status}`);
         const errorText = await ragRes.text();
         console.error(`❌ RAG error details: ${errorText}`);
         throw new Error(`RAG processing failed: ${ragRes.status}`);
       }
       const ragData = await ragRes.json();
       console.log('✅ RAG RETRIEVAL COMPLETE - Context retrieved successfully');
       console.log('📊 RAG context length:', ragData.context?.length || 0, 'characters');
       if (ragData.matches?.length > 0) {
         console.log(`📚 Retrieved ${ragData.matches.length} matches from knowledge base`);
         console.log(`📄 First match: "${ragData.matches[0]?.text?.substring(0, 50)}..."`);
       } else {
         console.log('⚠️ No matches found in knowledge base');
       }

       // 2) Get AI completion
       console.log('🤖 SENDING TO AI COMPLETION with RAG context...');
       const completionRes = await fetch('/api/completion', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           messages: [{ role: 'user', content: transcript.trim() }],
           context: ragData.context,
           conversationId
         }),
       });
       if (!completionRes.ok) {
         console.error(`❌ Completion failed with status: ${completionRes.status}`);
         throw new Error(`Completion failed: ${completionRes.status}`);
       }
       const { answer } = await completionRes.json();
       console.log('💬 AI RESPONSE RECEIVED:', answer.substring(0, 50) + (answer.length > 50 ? '...' : ''));

       // 3) Add assistant message
       console.log('📤 Adding AI response to conversation');
       const aiMessage: MessageType = {
         id: `realtime-response-${Date.now()}`,
         conversationId,
         role: 'assistant',
         content: answer,
         createdAt: new Date(),
       };
       setMessages(prev => [...prev, aiMessage]);

       // 4) TTS if in voice mode
       if (responseMode === 'voice') {
         console.log('🔊 Generating speech for AI response');
         await generateSpeech(answer);
       }
     } catch (err) {
       console.error('❌ ERROR processing realtime message:', err);
     } finally {
       setIsProcessing(false);
       console.log('✓ Realtime message processing complete');
     }
   };
   ```

3. **Button in UI**
   ```tsx
   <button
     type="button"
     onClick={() => setShowRealtimeVoice(true)}
     className="bg-green-500 text-white py-2 px-4 border border-green-500 hover:bg-green-600"
     disabled={isProcessing}
     title="Start Real-time Voice Conversation"
   >
     <FaMicrophone className="animate-pulse" />
   </button>
   ```

## RealtimeVoice Component

The `RealtimeVoice` component handles:

1. WebRTC connection setup
2. Audio streaming to/from the server
3. Data channel for real-time transcripts and other events
4. User interface for the real-time voice interaction

The component is still available in the codebase at `src/app/components/RealtimeVoice.tsx` but is not currently accessible through the UI.

## API Endpoints

The feature relies on these endpoints:

1. `/api/rt-session` - Creates a real-time session and returns an ephemeral token
2. `/api/rag-service` - Processes transcripts through the RAG pipeline
3. `/api/completion` - Gets AI responses
4. `/api/tts` - Converts text responses to speech

## Reimplementation Steps

To reimplement the real-time voice feature:

1. Uncomment the real-time voice button in `ChatInterface.tsx`
2. Uncomment the handler functions for real-time voice
3. Ensure the API endpoints are functioning correctly
4. Test with appropriate WebRTC and real-time API credentials

## Technical Requirements

- WebRTC support in the browser
- Access to OpenAI's real-time API
- Proper API tokens and credentials
- Working microphone hardware 