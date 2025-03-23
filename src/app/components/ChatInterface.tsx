'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaMicrophone, FaRobot, FaUser, FaCog } from 'react-icons/fa';
import AudioRecorder from './AudioRecorder';
import RealtimeVoice from './RealtimeVoice';
import Message from './Message';
import { Message as MessageType } from '@/types';
import browserLogger from '@/lib/utils/browser-logger';
import { useUser } from '@/app/contexts/UserContext';
import DebugPanel from './DebugPanel';
import UserSelector from './UserSelector';

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
  const [showRealtimeVoice, setShowRealtimeVoice] = useState(false);
  const [realtimeTranscript, setRealtimeTranscript] = useState<string | null>(null);
  const [aiAudio, setAiAudio] = useState<string | null>(null);
  const [responseMode, setResponseMode] = useState<'text' | 'voice'>('voice');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // NEW: debug message state & show panel
  const [debugMessages, setDebugMessages] = useState<DebugMessage[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  const [systemPrompts, setSystemPrompts] = useState<any[]>([]);
  const [activePrompt, setActivePrompt] = useState<any | null>(null);
  const [showPromptSelector, setShowPromptSelector] = useState(false);

  // Sound effects
  const sendSoundRef = useRef<HTMLAudioElement | null>(null);
  const receiveSoundRef = useRef<HTMLAudioElement | null>(null);

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
      sendSoundRef.current.currentTime = 0;
      sendSoundRef.current.play().catch(err => console.error('Failed to play sound:', err));
    }
  };
  
  // Play sound when receiving a message
  const playMessageReceivedSound = () => {
    if (receiveSoundRef.current) {
      receiveSoundRef.current.currentTime = 0;
      receiveSoundRef.current.play().catch(err => console.error('Failed to play sound:', err));
    }
  };

  // On initial mount, if no conversationId, create one
  useEffect(() => {
    if (!conversationId) {
      createNewConversation();
    } else {
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
      const response = await fetch(`/api/conversations/${id}`, { method: 'GET' });
      if (!response.ok) {
        throw new Error('Failed to load conversation');
      }
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading conversation:', error);
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
        { timestamp: new Date(), actionType: 'RAG_START', details: 'Calling /api/rag...' }
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

      setDebugMessages(prev => [
        ...prev,
        { timestamp: new Date(), actionType: 'RAG_DONE', details: `Retrieved context length: ${ragResult.context?.length || 0}` }
      ]);

      // 2) /api/completion
      setDebugMessages(prev => [
        ...prev,
        { timestamp: new Date(), actionType: 'COMPLETION_START', details: 'Calling /api/completion...' }
      ]);

      const completionResponse = await fetch('/api/completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMessage }],
          context: ragResult.context,
          conversationId: conversationId || ''
        }),
      });
      if (!completionResponse.ok) {
        throw new Error(`Completion failed: ${completionResponse.status}`);
      }
      const { answer } = await completionResponse.json();

      setDebugMessages(prev => [
        ...prev,
        { timestamp: new Date(), actionType: 'COMPLETION_DONE', details: `Got answer: ${answer.substring(0, 50)}...` }
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

      // optionally generate TTS
      if (responseMode === 'voice') {
        setDebugMessages(prev => [
          ...prev,
          { timestamp: new Date(), actionType: 'TTS_START', details: 'Requesting TTS from /api/tts' }
        ]);

        await generateSpeech(answer);
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
  };

  // handle transcription from short audio recordings
  const handleTranscription = (transcript: string) => {
    setInput(transcript);
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
    setAiAudio(audioContent);
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
    // Could optionally dispatch or treat similarly to typed messages
    console.log('Real-time voice feature is currently disabled or incomplete');
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

  return (
    <div className="flex flex-col h-full bg-[var(--imessage-bg)]">
      {/* Header with improved iMessage style */}
      <div className="flex items-center justify-between p-3 imessage-header border-b border-[var(--imessage-border)] shadow-sm">
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleNewChat}
            className="text-[var(--imessage-blue)] font-medium text-sm px-2 py-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-gray-800 transition flex items-center"
          >
            <span className="mr-1 text-lg">+</span> 
            <span className="hidden sm:inline">New Message</span>
          </button>
        </div>
        <div className="text-center flex-1">
          <h1 className="text-base font-semibold text-gray-800 dark:text-gray-200">Messages</h1>
          <p className="text-xs text-gray-500">AI Assistant</p>
        </div>
        <div className="flex items-center space-x-2">
          <UserSelector />
          <button
            onClick={() => setShowRealtimeVoice(prev => !prev)}
            className={`p-2 rounded-full ${
              showRealtimeVoice 
                ? 'bg-[var(--imessage-blue)] text-white' 
                : 'text-[var(--imessage-blue)] hover:bg-blue-50 dark:hover:bg-gray-800'
            } transition`}
            title="Voice chat"
            aria-label="Voice chat"
          >
            <FaMicrophone size={14} />
          </button>
          <button
            onClick={toggleResponseMode}
            className={`p-2 rounded-full ${
              responseMode === 'voice' 
                ? 'bg-[var(--imessage-blue)] text-white' 
                : 'text-[var(--imessage-blue)] hover:bg-blue-50 dark:hover:bg-gray-800'
            } transition`}
            title={responseMode === 'voice' ? 'Voice responses enabled' : 'Text-only responses'}
            aria-label="Toggle response mode"
          >
            <FaRobot size={14} />
          </button>
          <button 
            onClick={() => setShowDebug(!showDebug)}
            className={`p-2 rounded-full ${
              showDebug 
                ? 'bg-[var(--imessage-blue)] text-white' 
                : 'text-[var(--imessage-blue)] hover:bg-blue-50 dark:hover:bg-gray-800'
            } transition`}
            title="Debug panel"
            aria-label="Show debug panel"
          >
            <FaCog size={14} />
          </button>
        </div>
      </div>

      {/* Main chat container with iMessage style */}
      <div className="flex flex-1 overflow-hidden max-h-[calc(100vh-120px)]">
        <div className="flex-1 overflow-hidden relative">
          <div className="h-full overflow-y-auto px-4 py-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent" ref={messagesEndRef}>
            {/* User info at the top (like iMessage) */}
            <div className="flex flex-col items-center justify-center pt-4 pb-6">
              <div className="w-16 h-16 rounded-full bg-[var(--imessage-blue)] flex items-center justify-center text-white text-xl font-semibold mb-2 shadow-md">
                AI
              </div>
              <h2 className="text-base font-semibold dark:text-white">AI Assistant</h2>
              <p className="text-xs text-gray-500 mt-1">iMessage</p>
              <div className="text-xs text-[var(--imessage-blue)] mt-2 flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-1 animate-pulse"></span>
                Active Now
              </div>
            </div>
            
            {/* iMessage style date separator */}
            <div className="flex justify-center my-4">
              <div className="bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs px-3 py-1 rounded-full">
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
            
            {/* Refined iMessage typing indicator */}
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
      </div>

      {/* Audio player for TTS */}
      <audio ref={audioRef} className="hidden" />

      {/* Input area with iMessage style */}
      <div className="border-t border-[var(--imessage-border)] p-3 bg-[var(--imessage-bg)]">
        {showRealtimeVoice ? (
          <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-[var(--imessage-border)] p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Voice Chat</h3>
              <button
                onClick={() => setShowRealtimeVoice(false)}
                className="text-[var(--imessage-blue)] text-sm hover:underline"
              >
                Switch to Text
              </button>
            </div>
            <RealtimeVoice
              onPartialTranscript={handlePartialTranscript}
              onCompletedTranscript={handleRealtimeUserMessage}
              onPartialResponse={(text) => {}} 
              onCompletedResponse={(text) => {
                // Extract audio content if needed
                handleAudioAIResponse(text, '');
              }}
              conversationId={conversationId}
            />
          </div>
        ) : (
          <form 
            onSubmit={handleSubmit} 
            className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-full px-4 py-2 shadow-sm border border-[var(--imessage-border)]"
          >
            <AudioRecorder 
              onTranscription={handleTranscription} 
              onAIResponse={handleAudioAIResponse}
              conversationId={conversationId}
            />
            
            <input
              type="text"
              value={realtimeTranscript || input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!!realtimeTranscript || isProcessing}
              placeholder="iMessage"
              className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 text-base"
            />
            
            <button
              type="submit"
              disabled={(!input && !realtimeTranscript) || isProcessing}
              className={`p-1 rounded-full ${
                (!input && !realtimeTranscript) || isProcessing
                  ? 'text-gray-400'
                  : 'text-[var(--imessage-blue)] hover:bg-blue-50 dark:hover:bg-gray-700'
              } transition`}
              aria-label="Send message"
            >
              <FaPaperPlane size={18} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
