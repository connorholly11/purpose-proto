'use client';

import React, { useState, useRef, useEffect } from 'react';
// Remove icon imports
// import { FaPaperPlane, FaMicrophone, FaRobot, FaUser, FaCog, FaChevronDown, FaMemory } from 'react-icons/fa';
import AudioRecorder from './AudioRecorder';
import RealtimeVoice from './RealtimeVoice';
import Message from './Message';
import { Message as MessageType } from '@/types';
import browserLogger from '@/lib/utils/browser-logger';
import { useUser } from '@/app/contexts/UserContext';
import DebugPanel from './DebugPanel';
import UserSelector from './UserSelector';
import CollapsiblePrompt from './CollapsiblePrompt';
import { shouldSummarize } from '@/lib/services/memoryService';
import MemoryManager from './MemoryManager';

interface ChatInterfaceProps {
  initialConversationId?: string;
}

type DebugMessage = {
  timestamp: Date;
  actionType: string;
  details: string;
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ initialConversationId }) => {
  const { currentUser } = useUser();
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  // Real-time voice feature is temporarily disabled
  const [showRealtimeVoice, setShowRealtimeVoice] = useState(false);
  const [realtimeTranscript, setRealtimeTranscript] = useState<string | null>(null);
  const [aiAudio, setAiAudio] = useState<string | null>(null);
  const [responseMode, setResponseMode] = useState<'text' | 'voice'>('text');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Keep track of user conversations
  const [userConversations, setUserConversations] = useState<Record<string, string>>({});

  // NEW: debug message state & show panel
  const [debugMessages, setDebugMessages] = useState<DebugMessage[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  const [systemPrompts, setSystemPrompts] = useState<any[]>([]);
  const [activePrompt, setActivePrompt] = useState<any | null>(null);
  const [showPromptSelector, setShowPromptSelector] = useState(false);

  // Sound effects
  const sendSoundRef = useRef<HTMLAudioElement | null>(null);
  const receiveSoundRef = useRef<HTMLAudioElement | null>(null);

  const [showMemory, setShowMemory] = useState(false);

  // Create sound effect elements
  useEffect(() => {
    // Create send sound
    const sendSound = new Audio();
    sendSound.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAYGBgYGBgYGBgYGBgYGBgYGBgj4+Pj4+Pj4+Pj4+Pj4+Pj4+PwMDAwMDAwMDAwMDAwMDAwMDAwP//////////////////AAAAOkxhdmM1OC4xMzAAAAAAAAAAAAAAAAD/4ziMAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAADAAACwABgYGBgYGBgYGBgYGBgYGBgYGCPj4+Pj4+Pj4+Pj4+Pj4+Pj4/AwMDAwMDAwMDAwMDAwMDAwMDA//////////////////8AAAAOTGF2YzU4LjEzLjEwMAD/4zDAAAAAIAMuEAAAAAgQJgqgGgqgOlzA2hRJEgQJJFuFQCgsCwLAgCAIAgCmGVOwZAZ7nUAhDUfFpfgID6/AID6/CgEBMSgEBMTQfPnAL4Pgz4OgmA+DOvg93pgPg+nofxaD8LNj33voRxfgEAAAU16FWVa8quV/fI7n+z6KhHrRIAAAAJiR2xvcgAAACYkdsb2cAAABiJHaWdnAAAAAA==';
    sendSound.preload = 'auto';
    sendSoundRef.current = sendSound;
    
    // Create receive sound
    const receiveSound = new Audio();
    receiveSound.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAABAAAAVAAMDAwMDAwQEBAQEBAQFBQUFBQUFBgYGBgYGBgcHBwcHBwcICAgICAgICQkJCQkJCQoKCgoKCgoLCwsLCwsLDAwMDAwMDA0NDQ0NDQ0ODg4ODg4ODw8PDw8PD//////////////////////8AAAAkTGF2YzU4LjEzAAAAAAAAAAAAAAAAJP/jOMAAAAAAAAAAAAAAAAAAAAAAAABJbmZvAAAADwAAAAQAAAFQADAwMDAwMEBAQEBAQEBQUFBQUFBQYGBgYGBgYHBwcHBwcHCAgICAgICAkJCQkJCQkKCgoKCgoKCwsLCwsLCwwMDAwMDAwNDQ0NDQ0NDg4ODg4ODg8PDw8PDw8P///////////////////wAAAAlMYXZjNTguMTMuMTAwAP/jMMAAAAAgCqsQAAAACBAoCoAUAKATAgCaJEkSQJAihzBGgiRIEkTInELwC0AgQCE71VggQCBA4t/wJgSDf8CYEg3+DP8GQXzALIvgEAAAAAKlUzPfNAAXOHWIc/1N3/Oi1s7zogAAABwRlbmdwZHQAAAEYWx2dHAAAAAA=';
    receiveSound.preload = 'auto';
    receiveSoundRef.current = receiveSound;
    
    return () => {
      sendSound.pause();
      receiveSound.pause();
    };
  }, []);
  
  // Play sound when sending a message
  const playMessageSentSound = () => {
    if (sendSoundRef.current) {
      // Create a new context each time to prevent microphone activation
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Use existing sound reference but don't automatically connect to audio output
      sendSoundRef.current.currentTime = 0;
      
      // Only play the sound if not recording
      const audioRecorderActive = document.querySelector('[aria-label="Stop recording"]');
      if (!audioRecorderActive) {
        sendSoundRef.current.play().catch(err => console.error('Failed to play sound:', err));
      }
    }
  };
  
  // Play sound when receiving a message
  const playMessageReceivedSound = () => {
    if (receiveSoundRef.current) {
      // Create a new context each time to prevent microphone activation
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Use existing sound reference but don't automatically connect to audio output
      receiveSoundRef.current.currentTime = 0;
      
      // Only play the sound if not recording
      const audioRecorderActive = document.querySelector('[aria-label="Stop recording"]');
      if (!audioRecorderActive) {
        receiveSoundRef.current.play().catch(err => console.error('Failed to play sound:', err));
      }
    }
  };

  // Load user's conversation whenever the current user changes
  useEffect(() => {
    if (currentUser) {
      setDebugMessages(prev => [
        ...prev,
        { timestamp: new Date(), actionType: 'USER_SWITCH', details: `Switched to user: ${currentUser.name}` }
      ]);
      
      // If we already know this user's conversation, load it
      if (userConversations[currentUser.id]) {
        setConversationId(userConversations[currentUser.id]);
      } else {
        // Fetch the user's most recent conversation
        fetchUserConversation(currentUser.id);
      }
    }
  }, [currentUser?.id]);

  // Fetch the most recent conversation for a user
  const fetchUserConversation = async (userId: string) => {
    try {
      setDebugMessages(prev => [
        ...prev,
        { timestamp: new Date(), actionType: 'USER_FETCH', details: `Attempting to fetch conversations for user: ${userId}` }
      ]);
      
      // Try to get all conversations and filter by user
      const response = await fetch(`/api/conversations`, {
        headers: {
          'x-user-id': userId
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Find conversations for this user
        const userConversations = data.conversations?.filter(
          (conv: any) => conv.userId === userId
        ) || [];
        
        if (userConversations.length > 0) {
          // Take the most recent conversation (first one)
          const recentConversationId = userConversations[0].id;
          setDebugMessages(prev => [
            ...prev,
            { 
              timestamp: new Date(), 
              actionType: 'CONVERSATION_FOUND', 
              details: `Found existing conversation: ${recentConversationId}` 
            }
          ]);
          
          // Save this conversation ID for this user
          setUserConversations(prev => ({
            ...prev,
            [userId]: recentConversationId
          }));
          
          // Set as current conversation
          setConversationId(recentConversationId);
        } else {
          // No conversations found for this user, create a new one
          setDebugMessages(prev => [
            ...prev,
            { 
              timestamp: new Date(), 
              actionType: 'NO_CONVERSATIONS', 
              details: `No existing conversations found for user ${userId}, creating new one` 
            }
          ]);
          await createNewConversation();
        }
      } else {
        // API endpoint error - fallback to creating a new conversation
        setDebugMessages(prev => [
          ...prev,
          { 
            timestamp: new Date(), 
            actionType: 'API_ERROR', 
            details: `Error fetching conversations: ${response.status}, creating new conversation` 
          }
        ]);
        await createNewConversation();
      }
    } catch (error) {
      console.error('Error handling user conversations:', error);
      setDebugMessages(prev => [
        ...prev,
        { 
          timestamp: new Date(), 
          actionType: 'ERROR', 
          details: `Error handling conversations: ${(error as Error).message}, creating new conversation` 
        }
      ]);
      
      // If there's any error, just create a new conversation
      await createNewConversation();
    }
  };

  // On initial mount, if no conversationId, create one
  useEffect(() => {
    if (!conversationId && currentUser) {
      createNewConversation();
    } else if (conversationId) {
      loadConversation(conversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Load mode from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('responseMode');
    if (savedMode === 'text' || savedMode === 'voice') {
      setResponseMode(savedMode);
    }
  }, []);

  // Save mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('responseMode', responseMode);
  }, [responseMode]);

  // Force real-time voice to remain disabled
  useEffect(() => {
    if (showRealtimeVoice) {
      // Force it back to false if somehow enabled
      setShowRealtimeVoice(false);
    }
  }, [showRealtimeVoice]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Play AI audio if available
  useEffect(() => {
    if (aiAudio && audioRef.current) {
      const audioSrc = `data:audio/mp3;base64,${aiAudio}`;
      audioRef.current.src = audioSrc;
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    }
  }, [aiAudio]);

  // Load system prompts (example feature)
  useEffect(() => {
    const fetchSystemPrompts = async () => {
      try {
        const response = await fetch('/api/system-prompts');
        if (response.ok) {
          const data = await response.json();
          setSystemPrompts(data.systemPrompts || []);

          // Also fetch the active prompt
          const activeResponse = await fetch('/api/system-prompts?activeOnly=true');
          if (activeResponse.ok) {
            const activeData = await activeResponse.json();
            if (activeData.systemPrompt) {
              setActivePrompt(activeData.systemPrompt);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching system prompts:', error);
      }
    };
    fetchSystemPrompts();
  }, []);

  // ---------------------------------------
  // create new conversation
  // ---------------------------------------
  const createNewConversation = async () => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (currentUser?.id) {
        headers['x-user-id'] = currentUser.id;
      }

      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers,
      });
      if (!response.ok) {
        browserLogger.error('ChatInterface', 'Failed to create conversation', {
          status: response.status
        });
        setDebugMessages(prev => [...prev, {
          timestamp: new Date(),
          actionType: 'ERROR',
          details: `Failed to create conversation (status ${response.status})`
        }]);
        throw new Error('Failed to create conversation');
      }

      const data = await response.json();
      
      // Save this conversation ID for the current user
      if (currentUser) {
        setUserConversations(prev => ({
          ...prev,
          [currentUser.id]: data.id
        }));
      }
      
      setConversationId(data.id);
      setMessages([]);

      // debug logging
      setDebugMessages(prev => [
        ...prev,
        { timestamp: new Date(), actionType: 'NEW_CONVERSATION', details: `Created conversation ${data.id}` }
      ]);
    } catch (error) {
      browserLogger.error('ChatInterface', 'Error creating conversation', {
        error: (error as Error).message,
      });
      console.error('Error creating conversation:', error);
    }
  };

  // ---------------------------------------
  // "New Chat" button handler
  // ---------------------------------------
  const handleNewChat = async () => {
    if (isProcessing) return; // Don't allow new chats while processing
    await createNewConversation();
  };

  // ---------------------------------------
  // load conversation
  // ---------------------------------------
  const loadConversation = async (id: string) => {
    try {
      setDebugMessages(prev => [
        ...prev,
        { timestamp: new Date(), actionType: 'LOAD_CONVERSATION', details: `Loading conversation ${id}` }
      ]);
      
      const headers: HeadersInit = {};
      if (currentUser?.id) {
        headers['x-user-id'] = currentUser.id;
      }
      
      const response = await fetch(`/api/conversations/${id}`, { 
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load conversation: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Make sure we display ALL messages in the UI
      setMessages(data.messages || []);
      
      // Save this conversation ID for the current user
      if (currentUser) {
        setUserConversations(prev => ({
          ...prev,
          [currentUser.id]: id
        }));
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      setDebugMessages(prev => [
        ...prev,
        { timestamp: new Date(), actionType: 'ERROR', details: `Error loading conversation: ${(error as Error).message}` }
      ]);
    }
  };

  // scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // handle user message submission (typed)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Check if we're already recording audio - if so, don't proceed
    const isRecordingAudio = document.querySelector('[aria-label="Stop recording"]');
    if (isRecordingAudio) {
      return;
    }

    // Play send sound effect
    playMessageSentSound();

    const userMessage = input.trim();
    setInput('');
    setIsProcessing(true);

    const newUserMessage: MessageType = {
      id: `temp-${Date.now()}`,
      conversationId: conversationId || '',
      role: 'user',
      content: userMessage,
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, newUserMessage]);

    // debug
    setDebugMessages(prev => [
      ...prev,
      { timestamp: new Date(), actionType: 'USER_MESSAGE', details: userMessage }
    ]);

    try {
      // 1) RAG call
      setDebugMessages(prev => [
        ...prev,
        { timestamp: new Date(), actionType: 'RAG_START', details: `Calling /api/rag with query: "${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}"` }
      ]);

      const ragResponse = await fetch('/api/rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || ''
        },
        body: JSON.stringify({
          query: userMessage,
          topK: 5,
          source: 'chat',
          conversationId: conversationId || ''
        }),
      });
      if (!ragResponse.ok) {
        throw new Error(`RAG processing failed: ${ragResponse.status}`);
      }
      const ragResult = await ragResponse.json();

      // Log the RAG results
      const matchesCount = ragResult.matches?.length || 0;
      setDebugMessages(prev => [
        ...prev,
        { timestamp: new Date(), actionType: 'RAG_MATCHES', details: `Retrieved ${matchesCount} matches from knowledge base` }
      ]);

      // Log details about each match if available
      if (ragResult.matches && ragResult.matches.length > 0) {
        ragResult.matches.forEach((match: any, index: number) => {
          setDebugMessages(prev => [
            ...prev,
            { 
              timestamp: new Date(), 
              actionType: 'RAG_MATCH_DETAIL', 
              details: `Match #${index + 1}\nScore: ${match.score.toFixed(4)}\nSource: ${match.source || 'Unknown'}\nContent: ${match.text.substring(0, 100)}...` 
            }
          ]);
        });
      } else {
        setDebugMessages(prev => [
          ...prev,
          { 
            timestamp: new Date(), 
            actionType: 'RAG_NO_MATCHES', 
            details: `No matches found in knowledge base. This may be expected for general questions.` 
          }
        ]);
      }

      setDebugMessages(prev => [
        ...prev,
        { 
          timestamp: new Date(), 
          actionType: 'RAG_CONTEXT_SIZE', 
          details: `Total context length: ${ragResult.context?.length || 0} characters` 
        }
      ]);

      // 2) /api/completion
      setDebugMessages(prev => [
        ...prev,
        { timestamp: new Date(), actionType: 'COMPLETION_START', details: 'Calling /api/completion with RAG context...' }
      ]);

      // Pass through conversation context
      const previousMessages = messages.slice(-6); // Get last 6 messages for context
      const contextMessages = previousMessages.map(msg => ({
        role: msg.role, 
        content: msg.content
      }));
      
      // Add the current user message
      contextMessages.push({ role: 'user', content: userMessage });

      const completionResponse = await fetch('/api/completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: contextMessages,
          context: ragResult.context,
          conversationId: conversationId || ''
        }),
      });
      if (!completionResponse.ok) {
        throw new Error(`Completion failed: ${completionResponse.status}`);
      }
      const { answer } = await completionResponse.json();

      // Play receive sound effect
      playMessageReceivedSound();

      setDebugMessages(prev => [
        ...prev,
        { timestamp: new Date(), actionType: 'COMPLETION_DONE', details: `Got answer (${answer.length} chars): ${answer.substring(0, 50)}...` }
      ]);

      // add AI message
      const newAiMessage: MessageType = {
        id: `temp-response-${Date.now()}`,
        conversationId: conversationId || '',
        role: 'assistant',
        content: answer,
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, newAiMessage]);

      // Store this conversation in the knowledge base so we remember it
      try {
        setDebugMessages(prev => [
          ...prev,
          { timestamp: new Date(), actionType: 'STORE_MEMORY', details: 'Storing conversation in knowledge base...' }
        ]);
        
        // In a real implementation, we would store this in the knowledge base
        // For now, we'll just log it to the debug console
        if (currentUser?.id) {
          const memoryResponse = await fetch('/api/knowledge', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': currentUser.id
            },
            body: JSON.stringify({
              title: `Conversation on ${new Date().toLocaleDateString()}`,
              content: `User: ${userMessage}\n\nAI: ${answer}`,
              type: 'conversation'
            })
          });
          
          if (memoryResponse.ok) {
            setDebugMessages(prev => [
              ...prev,
              { timestamp: new Date(), actionType: 'MEMORY_STORED', details: 'Successfully stored conversation in knowledge base' }
            ]);
          }
        }
      } catch (memoryError) {
        console.error('Error storing conversation memory:', memoryError);
        setDebugMessages(prev => [
          ...prev,
          { timestamp: new Date(), actionType: 'MEMORY_ERROR', details: `Failed to store memory: ${(memoryError as Error).message}` }
        ]);
      }

      // optionally generate TTS
      if (responseMode === 'voice') {
        setDebugMessages(prev => [
          ...prev,
          { timestamp: new Date(), actionType: 'TTS_START', details: 'Requesting TTS from /api/tts' }
        ]);

        // Text-to-speech is disabled
        // await generateSpeech(answer);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      setDebugMessages(prev => [
        ...prev,
        { timestamp: new Date(), actionType: 'ERROR', details: `Message process error: ${(error as Error).message}` }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // optionally generate speech (TTS)
  const generateSpeech = async (text: string) => {
    // Text-to-speech functionality is disabled
    return;
    
    /* 
    try {
      const ttsResponse = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!ttsResponse.ok) {
        console.error(`TTS API error: ${ttsResponse.status}`);
        return;
      }
      const { audioContent } = await ttsResponse.json();
      if (audioContent) {
        setAiAudio(audioContent);
        setDebugMessages(prev => [
          ...prev,
          { timestamp: new Date(), actionType: 'TTS_DONE', details: 'Audio returned successfully' }
        ]);
      }
    } catch (error) {
      console.error('Error generating speech:', error);
      setDebugMessages(prev => [
        ...prev,
        { timestamp: new Date(), actionType: 'ERROR', details: `TTS error: ${(error as Error).message}` }
      ]);
    }
    */
  };

  // handle transcription from short audio recordings
  const handleTranscription = (transcript: string) => {
    setInput(transcript);
    // We don't auto-submit the form, just set the input value
    setDebugMessages(prev => [
      ...prev,
      { timestamp: new Date(), actionType: 'AUDIO_TRANSCRIBE', details: `Transcribed: ${transcript}` }
    ]);
  };

  // handle AI response from short audio recorder
  const handleAudioAIResponse = (answer: string, audioContent: string) => {
    if (!conversationId) return;

    const newUserMessage: MessageType = {
      id: `temp-${Date.now()}`,
      conversationId,
      role: 'user',
      content: input,
      createdAt: new Date(),
    };
    const newAiMessage: MessageType = {
      id: `temp-response-${Date.now()}`,
      conversationId,
      role: 'assistant',
      content: answer,
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, newUserMessage, newAiMessage]);
    // Text-to-speech is disabled, so we don't set audio content
    // setAiAudio(audioContent);
    setInput('');

    // debug
    setDebugMessages(prev => [
      ...prev,
      { timestamp: new Date(), actionType: 'AUDIO_AI_RESPONSE', details: `Answer: ${answer}` }
    ]);
  };

  // partial transcripts from Realtime
  const handlePartialTranscript = (transcript: string) => {
    setRealtimeTranscript(transcript);
  };

  // NEW: handle final transcript from Realtime voice
  const handleRealtimeUserMessage = async (transcript: string) => {
    if (!transcript || !transcript.trim() || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Play send sound
      playMessageSentSound();
      
      // Create a temporary user message
      const userTempId = `temp-user-${Date.now()}`;
      const userMessage: MessageType = {
        id: userTempId,
        conversationId: conversationId || '',
        role: 'user',
        content: transcript,
        createdAt: new Date(),
      };
      
      // Add user message to state
      setMessages(prevMessages => [...prevMessages, userMessage]);
      
      // Log for debugging
      console.log(`Processing realtime voice transcript: "${transcript}"`);
      setDebugMessages(prev => [
        ...prev,
        { 
          timestamp: new Date(), 
          actionType: 'REALTIME_VOICE', 
          details: `Processing: "${transcript.substring(0, 50)}${transcript.length > 50 ? '...' : ''}"` 
        }
      ]);
      
      // Process with the same API as regular messages
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (currentUser?.id) {
        headers['x-user-id'] = currentUser.id;
      }
      
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: transcript }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process voice transcript');
      }
      
      const data = await response.json();
      
      // Update messages with real IDs
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === userTempId ? { ...msg, id: data.userMessage.id } : msg
        )
      );
      
      // Add AI response
      const aiMessage: MessageType = {
        id: data.aiMessage.id,
        conversationId: conversationId || '',
        role: 'assistant',
        content: data.aiMessage.content,
        createdAt: new Date(data.aiMessage.createdAt),
      };
      
      // Play receive sound
      playMessageReceivedSound();
      
      // Add AI message to state
      setMessages(prevMessages => [...prevMessages, aiMessage]);
      
      // Get audio if in voice mode
      if (responseMode === 'voice') {
        try {
          // Text-to-speech is disabled
          /*
          const ttsResponse = await fetch(`/api/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: data.aiMessage.content }),
          });
          
          if (ttsResponse.ok) {
            const audioData = await ttsResponse.json();
            if (audioData.audioContent) {
              setAiAudio(audioData.audioContent);
            }
          }
          */
        } catch (ttsError) {
          console.error('Error generating TTS for voice response:', ttsError);
        }
      }
    } catch (error) {
      console.error('Error processing realtime voice message:', error);
      setDebugMessages(prev => [
        ...prev,
        { 
          timestamp: new Date(), 
          actionType: 'ERROR', 
          details: `Realtime voice error: ${(error as Error).message}` 
        }
      ]);
    } finally {
      setIsProcessing(false);
      setRealtimeTranscript(null); // Clear any transcript
    }
  };

  // handle message likes
  const handleLikeMessage = async (messageId: string) => {
    try {
      await fetch(`/api/message/${messageId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: 'like' }),
      });
    } catch (error) {
      console.error('Error liking message:', error);
    }
  };

  // handle message dislikes
  const handleDislikeMessage = async (messageId: string) => {
    try {
      await fetch(`/api/message/${messageId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: 'dislike' }),
      });
    } catch (error) {
      console.error('Error disliking message:', error);
    }
  };

  // toggle voice/text mode
  const toggleResponseMode = () => {
    setResponseMode(prev => (prev === 'text' ? 'voice' : 'text'));
  };

  // set system prompt
  const setSystemPrompt = async (promptId: string) => {
    try {
      const response = await fetch(`/api/system-prompts/${promptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });
      if (response.ok) {
        const data = await response.json();
        setActivePrompt(data.systemPrompt);
        setShowPromptSelector(false);
        
        // Add debug message
        setDebugMessages(prev => [
          ...prev,
          { timestamp: new Date(), actionType: 'SYSTEM_PROMPT', details: `Set system prompt to ${data.systemPrompt.name}` }
        ]);
        
        // If there's an existing conversation, create a new one to apply the new system prompt
        if (conversationId) {
          await createNewConversation();
        }
      }
    } catch (error) {
      console.error('Error setting system prompt:', error);
    }
  };

  // useEffect to reload conversation when navigating between tabs
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId]);

  const handleUserMessage = async (message: string) => {
    if (!message.trim() || isProcessing) return;
    
    setIsProcessing(true);
    
    // Play send sound
    playMessageSentSound();
    
    // Create a temporary message
    const tempId = `temp-${Date.now()}`;
    const userMessage: MessageType = {
      id: tempId,
      conversationId: conversationId || '',
      role: 'user',
      content: message,
      createdAt: new Date(),
    };
    
    // Add user message to state
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (currentUser?.id) {
        headers['x-user-id'] = currentUser.id;
      }
      
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: message }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const data = await response.json();
      
      // Update messages with real IDs
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === tempId ? { ...msg, id: data.userMessage.id } : msg
        )
      );
      
      // Add AI response
      const aiMessage: MessageType = {
        id: data.aiMessage.id,
        conversationId: conversationId || '',
        role: 'assistant',
        content: data.aiMessage.content,
        createdAt: new Date(data.aiMessage.createdAt),
      };
      
      // Play receive sound
      playMessageReceivedSound();
      
      // Add AI message to state
      setMessages(prevMessages => [...prevMessages, aiMessage]);
      
      // Get audio if in voice mode
      if (responseMode === 'voice') {
        const ttsResponse = await fetch(`/api/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: data.aiMessage.content }),
        });
        
        if (ttsResponse.ok) {
          const audioData = await ttsResponse.json();
          if (audioData.audioContent) {
            setAiAudio(audioData.audioContent);
          }
        }
      }
      
      // Add debug message
      setDebugMessages(prev => [
        ...prev,
        { 
          timestamp: new Date(), 
          actionType: 'SENT_MESSAGE', 
          details: `Sent: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"` 
        }
      ]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error to debug
      setDebugMessages(prev => [
        ...prev,
        { 
          timestamp: new Date(), 
          actionType: 'ERROR', 
          details: `Error sending message: ${(error as Error).message}` 
        }
      ]);
    } finally {
      setIsProcessing(false);
      setInput('');
    }
  };

  // Add a function to handle prompt selector toggle
  const togglePromptSelector = () => {
    setShowPromptSelector(!showPromptSelector);
  };

  // Process and send message
  const handleSendMessage = async (textContent: string = input) => {
    if (!textContent.trim() && !realtimeTranscript) return;
    
    // Check if we're already recording audio - if so, don't proceed
    const isRecordingAudio = document.querySelector('[aria-label="Stop recording"]');
    if (isRecordingAudio) {
      return;
    }
    
    // Clear input field and reset transcript
    setInput('');
    setRealtimeTranscript(null);
    
    const content = textContent.trim() || realtimeTranscript || '';
    
    if (!currentUser) {
      setDebugMessages(prev => [
        ...prev,
        { timestamp: new Date(), actionType: 'ERROR', details: 'No user selected' }
      ]);
      return;
    }
    
    // Add user message to chat
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      createdAt: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage as any]);
    playMessageSentSound();
    
    // Start processing animation
    setIsProcessing(true);
    
    try {
      // Check if conversation should be summarized
      if (conversationId) {
        try {
          const shouldCreateSummary = await shouldSummarize(conversationId);
          
          if (shouldCreateSummary) {
            setDebugMessages(prev => [
              ...prev,
              { timestamp: new Date(), actionType: 'MEMORY_SUMMARIZE', details: 'Creating conversation summary' }
            ]);
            
            // Create a memory summary in the background
            fetch(`/api/conversations/${conversationId}/memory`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ type: 'short_term' })
            }).catch(err => {
              console.error('Failed to create memory summary:', err);
            });
          }
        } catch (err) {
          console.error('Error checking if conversation should be summarized:', err);
        }
      }

      // Create or get conversation ID
      if (!conversationId) {
        try {
          // Create a new conversation
          const createResponse = await fetch('/api/conversations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': currentUser.id
            },
            body: JSON.stringify({
              systemPromptId: activePrompt?.id
            })
          });
          
          if (!createResponse.ok) {
            throw new Error(`Failed to create conversation: ${createResponse.statusText}`);
          }
          
          const data = await createResponse.json();
          const newConversationId = data.id;
          
          // Update state with new conversation ID
          setConversationId(newConversationId);
          
          // Store this conversation for this user
          setUserConversations(prev => ({
            ...prev,
            [currentUser.id]: newConversationId
          }));
          
          // Add debug message
          setDebugMessages(prev => [
            ...prev,
            { 
              timestamp: new Date(), 
              actionType: 'CONVERSATION_CREATED', 
              details: `Created new conversation: ${newConversationId}` 
            }
          ]);
          
          // Send the message using this new conversation ID
          await sendMessageToAPI(content, newConversationId);
          return;
        } catch (error) {
          console.error('Error creating conversation:', error);
          setDebugMessages(prev => [
            ...prev,
            { 
              timestamp: new Date(), 
              actionType: 'ERROR', 
              details: `Error creating conversation: ${(error as Error).message}` 
            }
          ]);
          return;
        }
      }
      
      // If we already have a conversation ID, use it to send the message
      await sendMessageToAPI(content, conversationId);
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error to debug
      setDebugMessages(prev => [
        ...prev,
        { 
          timestamp: new Date(), 
          actionType: 'ERROR', 
          details: `Error sending message: ${(error as Error).message}` 
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to send message to API
  const sendMessageToAPI = async (content: string, convId: string) => {
    if (!convId) {
      setDebugMessages(prev => [
        ...prev,
        { timestamp: new Date(), actionType: 'ERROR', details: 'Cannot send message without conversation ID' }
      ]);
      return 'Error: No conversation ID. Please reload the page and try again.';
    }
    
    if (!content) {
      return 'I need a message to respond to.';
    }
    
    try {
      const apiMessages = [
        ...messages.slice(-8), // Include recent context (last 8 messages)
        { 
          role: 'user', 
          content: content 
        }
      ];
      
      setDebugMessages(prev => [
        ...prev,
        { 
          timestamp: new Date(), 
          actionType: 'API_CALL', 
          details: `Calling /api/completion with ${apiMessages.length} messages` 
        }
      ]);
      
      // Get RAG results to augment response
      let ragContext = '';
      try {
        // Call RAG service to find relevant content
        const ragResponse = await fetch('/api/rag', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: content,
            conversationId: convId
          })
        });
        
        if (ragResponse.ok) {
          const ragData = await ragResponse.json();
          // Only use RAG context if we found relevant content
          if (ragData.results && ragData.results.length > 0) {
            // Format RAG results as context
            ragContext = ragData.results.map((result: any, i: number) => 
              `[${i+1}] ${result.content}`
            ).join('\n\n');
            
            setDebugMessages(prev => [
              ...prev,
              { 
                timestamp: new Date(), 
                actionType: 'RAG_CONTEXT', 
                details: `Got ${ragData.results.length} RAG results (${ragContext.length} chars)` 
              }
            ]);
          } else {
            setDebugMessages(prev => [
              ...prev,
              { 
                timestamp: new Date(), 
                actionType: 'RAG_NO_RESULTS', 
                details: 'No relevant RAG results found' 
              }
            ]);
          }
        }
      } catch (err) {
        console.error('Failed to get RAG results:', err);
        setDebugMessages(prev => [
          ...prev,
          { 
            timestamp: new Date(), 
            actionType: 'RAG_ERROR', 
            details: `Error getting RAG results: ${(err as Error).message}` 
          }
        ]);
        // Continue without RAG context
      }
      
      // Make API call to get AI response
      const response = await fetch('/api/completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: apiMessages,
          context: ragContext,
          conversationId: convId,
          userId: currentUser?.id
        })
      });
      
      // Handle API response
      if (response.ok) {
        const data = await response.json();
        setDebugMessages(prev => [
          ...prev,
          { 
            timestamp: new Date(), 
            actionType: 'API_RESPONSE', 
            details: `Got response (${data.answer.length} chars)` 
          }
        ]);
        return data.answer;
      } else {
        // Handle error response
        const errorResponse = await response.json();
        console.error('API error:', errorResponse);
        setDebugMessages(prev => [
          ...prev,
          { 
            timestamp: new Date(), 
            actionType: 'API_ERROR', 
            details: `Error ${response.status}: ${errorResponse.error || 'Unknown error'}` 
          }
        ]);
        return `I'm having trouble responding right now. (Error: ${errorResponse.error || response.status})`;
      }
    } catch (err) {
      console.error('Failed to get AI response:', err);
      setDebugMessages(prev => [
        ...prev,
        { 
          timestamp: new Date(), 
          actionType: 'API_EXCEPTION', 
          details: `Exception: ${(err as Error).message}` 
        }
      ]);
      return "I'm having trouble connecting to my brain right now. Please try again in a moment.";
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--imessage-bg)] rounded-[18px] overflow-hidden">
      {/* Top header with improved styling */}
      <div className="imessage-header flex justify-between items-center px-3 sm:px-5 py-3 z-10 sticky top-0">
        <div className="flex items-center">
          <button 
            onClick={handleNewChat}
            className="text-[var(--primary-blue)] font-medium text-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-full hover:bg-blue-50/70 dark:hover:bg-slate-800/70 transition-all flex items-center enhanced-button ripple"
          >
            <span className="mr-1 text-lg">+</span> 
            <span className="hidden sm:inline">New Message</span>
          </button>
        </div>
        <h1 className="text-base font-semibold text-slate-700 dark:text-slate-200">Messages</h1>
        <div className="flex space-x-1 sm:space-x-2">
          <UserSelector />
          <button
            onClick={() => setShowMemory(!showMemory)}
            className={`p-1.5 sm:p-2 rounded-full enhanced-button ripple ${
              showMemory
                ? 'bg-[var(--primary-blue)] text-white'
                : 'text-[var(--primary-blue)] hover:bg-blue-50/70 dark:hover:bg-slate-800/70'
            } transition-all`}
            title="Conversation Memory"
            aria-label="View conversation memory"
          >
            Memory
          </button>
          {/* Text-to-voice button for AI responses - removed */}
          <button 
            onClick={() => setShowDebug(!showDebug)}
            className={`p-1.5 sm:p-2 rounded-full enhanced-button ripple ${
              showDebug 
                ? 'bg-[var(--primary-blue)] text-white' 
                : 'text-[var(--primary-blue)] hover:bg-blue-50/70 dark:hover:bg-slate-800/70'
            } transition-all`}
            title="Debug panel"
            aria-label="Show debug panel"
          >
            Debug
          </button>
        </div>
      </div>

      {/* Main chat container with improved styling */}
      <div className="flex flex-1 overflow-hidden max-h-[calc(100vh-130px)]">
        <div className="flex-1 overflow-hidden relative">
          <div className="h-full overflow-y-auto px-3 sm:px-5 py-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent" ref={messagesEndRef}>
            {/* User info at the top (like iMessage) */}
            <div className="flex flex-col items-center justify-center pt-3 sm:pt-5 pb-4 sm:pb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full avatar-container flex items-center justify-center text-white text-xl font-semibold mb-2 sm:mb-3">
                AI
              </div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200">
                {activePrompt ? activePrompt.name : 'AI Assistant'}
              </h2>
              
              <div className="flex flex-col items-center w-full max-w-sm space-y-1 mt-2">
                <div className="flex items-center">
                  <button
                    onClick={togglePromptSelector}
                    className="flex items-center space-x-1 text-xs text-slate-500 hover:text-[var(--primary-blue)] transition-all px-2 sm:px-3 py-1 sm:py-1.5 rounded-full hover:bg-blue-50/80 dark:hover:bg-slate-800/80 enhanced-button"
                  >
                    <span>Change Prompt</span>
                  </button>
                  
                  {showPromptSelector && (
                    <div className="absolute mt-36 sm:mt-48 w-48 sm:w-56 floating-panel z-50">
                      <div className="p-2">
                        <h3 className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 px-2">Select System Prompt</h3>
                        <div className="max-h-36 sm:max-h-48 overflow-y-auto scrollbar-thin">
                          {systemPrompts.length > 0 ? (
                            systemPrompts.map(prompt => (
                              <button
                                key={prompt.id}
                                onClick={() => setSystemPrompt(prompt.id)}
                                className={`w-full text-left px-3 py-2 text-xs sm:text-sm rounded-md ripple ${
                                  activePrompt?.id === prompt.id
                                    ? 'bg-blue-50/90 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300'
                                    : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                                }`}
                              >
                                {prompt.name}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                              No prompts available
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Add button to view the full system prompt content */}
                {activePrompt && (
                  <CollapsiblePrompt prompt={activePrompt} />
                )}
              </div>
              
              <div className="text-xs text-[var(--primary-blue)] mt-2 sm:mt-3 flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-1 animate-pulse"></span>
                Active Now
              </div>
            </div>
            
            {/* iMessage style date separator */}
            <div className="flex justify-center my-3 sm:my-4">
              <div className="bg-[var(--neutral-gray)]/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs px-3 sm:px-4 py-1 rounded-full backdrop-blur-sm">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
            </div>

            {messages.map((msg, index) => (
              <Message
                key={msg.id || `temp-${index}`}
                message={msg}
                onLike={msg.id && !msg.id.startsWith('temp') ? () => handleLikeMessage(msg.id) : undefined}
                onDislike={msg.id && !msg.id.startsWith('temp') ? () => handleDislikeMessage(msg.id) : undefined}
              />
            ))}
            
            {/* Refined typing indicator */}
            {isProcessing && (
              <div className="flex justify-start my-1">
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {showDebug && <DebugPanel debugMessages={debugMessages} onClose={() => setShowDebug(false)} />}
        {showMemory && conversationId && (
          <div className="w-80 border-l border-gray-200 dark:border-gray-700 overflow-y-auto bg-white dark:bg-gray-900">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-sm font-medium">Conversation Memory</h2>
              <button 
                onClick={() => setShowMemory(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                &times;
              </button>
            </div>
            <div className="p-2">
              <MemoryManager conversationId={conversationId} />
            </div>
          </div>
        )}
      </div>

      {/* Audio player for TTS */}
      <audio ref={audioRef} className="hidden" />

      {/* Input area with refined styling */}
      <div className="input-container">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            // Add a small delay to prevent the form submission from interfering with audio controls
            setTimeout(() => {
              if (!isProcessing && input.trim()) {
                handleSubmit(e);
              }
            }, 50);
          }} 
          className="flex items-center space-x-2 sm:space-x-3"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message"
              className="input-field w-full focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue-light)] focus:border-transparent text-sm sm:text-base"
              disabled={isProcessing || showRealtimeVoice}
            />
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            <AudioRecorder
              onTranscription={handleTranscription}
              onAIResponse={handleAudioAIResponse}
              conversationId={conversationId}
              className="enhanced-button p-2 rounded-full text-[var(--primary-blue)] bg-blue-50/80 dark:bg-slate-800/80 hover:bg-blue-100/80 dark:hover:bg-slate-700/80"
            />
            
            <button
              type="button" 
              onClick={() => {
                if (!isProcessing && input.trim()) {
                  handleSendMessage();
                }
              }}
              disabled={isProcessing || !input.trim()}
              className={`enhanced-button p-2 rounded-full ${
                input.trim()
                  ? 'primary-btn'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
              aria-label="Send message"
            >
              Send
            </button>
          </div>
        </form>
      </div>
      
      {/* Do not show real-time voice UI by default */}
      {showRealtimeVoice && (
        <RealtimeVoice 
          onPartialTranscript={handlePartialTranscript} 
          onCompletedTranscript={handleRealtimeUserMessage}
          onPartialResponse={() => {}}
          onCompletedResponse={(text) => {
            if (text && text.trim()) {
              handleAudioAIResponse(text, '');
            }
          }}
          conversationId={conversationId}
        />
      )}
    </div>
  );
};

export default ChatInterface;
