'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaMicrophone, FaRobot, FaUser, FaCog } from 'react-icons/fa';
import AudioRecorder from './AudioRecorder';
import RealtimeVoice from './RealtimeVoice';
import Message from './Message';
import { Message as MessageType } from '@/types';
import browserLogger from '@/lib/utils/browser-logger';
import { useUser } from '@/app/contexts/UserContext';
import DebugPanel from './DebugPanel'; // NEW import for the debug panel

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

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Top bar */}
      <div className="bg-gray-800 text-white p-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <FaRobot className="mr-2" />
            <span className="text-sm">
              {activePrompt ? activePrompt.name : 'Default System Prompt'}
            </span>
          </div>
          
          {/* New Conversation Tab */}
          <button
            onClick={handleNewChat}
            className="px-3 py-1 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center"
          >
            <span className="mr-1">+</span> New Conversation
          </button>
        </div>
        <button
          onClick={() => setShowPromptSelector(!showPromptSelector)}
          className="text-white hover:text-gray-300"
        >
          <FaCog />
        </button>
      </div>

      {showPromptSelector && (
        <div className="bg-gray-700 text-white p-3">
          <h3 className="text-sm font-bold mb-2">Select System Prompt</h3>
          <div className="max-h-40 overflow-y-auto">
            {systemPrompts.map(prompt => (
              <div
                key={prompt.id}
                onClick={() => setSystemPrompt(prompt.id)}
                className={`p-2 cursor-pointer rounded hover:bg-gray-600 ${
                  activePrompt?.id === prompt.id ? 'bg-gray-600' : ''
                }`}
              >
                <div className="font-medium">{prompt.name}</div>
                <div className="text-xs text-gray-300">
                  {prompt.content.substring(0, 60)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-screen-lg mx-auto">
          {messages.map(message => (
            <Message
              key={message.id}
              message={message}
              onLike={() => handleLikeMessage(message.id)}
              onDislike={() => handleDislikeMessage(message.id)}
            />
          ))}
          <div ref={messagesEndRef} />
          {realtimeTranscript && (
            <div className="my-3 p-4 bg-gray-200 rounded-lg max-w-3xl">
              <div className="flex items-start">
                <div className="mr-3 mt-0.5 text-gray-600">
                  <FaUser />
                </div>
                <div>
                  <div className="font-semibold text-gray-600">
                    You (speaking)...
                  </div>
                  <div className="mt-1 text-gray-800">{realtimeTranscript}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden audio element for AI TTS */}
      <audio ref={audioRef} className="hidden" controls />

      {/* Input area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="max-w-screen-lg mx-auto">
          <div className="flex justify-between mb-3">
            <button
              onClick={toggleResponseMode}
              className={`px-3 py-1 text-sm rounded-md ${
                responseMode === 'voice'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {responseMode === 'voice' ? 'Voice Mode' : 'Text-only Mode'}
            </button>

            {/* NEW Chat & Debug Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="px-3 py-1 text-sm rounded-md bg-gray-400 text-white hover:bg-gray-500"
              >
                Toggle Debug
              </button>
            </div>
          </div>

          {showRealtimeVoice ? (
            <div>
              <div className="flex justify-between mb-3">
                <button
                  onClick={() => setShowRealtimeVoice(false)}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  ← Back to Text Input
                </button>
              </div>
              <RealtimeVoice
                onPartialTranscript={handlePartialTranscript}
                onCompletedTranscript={handleRealtimeUserMessage}
                onPartialResponse={() => {}}
                onCompletedResponse={() => {}}
                conversationId={conversationId}
              />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex items-center">
              <input
                type="text"
                placeholder="Type your message..."
                className="flex-1 py-2 px-4 rounded-l-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isProcessing}
              />
              <AudioRecorder
                onTranscription={handleTranscription}
                onAIResponse={handleAudioAIResponse}
                conversationId={conversationId}
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white py-2 px-4 rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isProcessing}
              >
                <FaPaperPlane />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* DebugPanel Slide-Out (optional styling) */}
      {showDebug && (
        <DebugPanel debugMessages={debugMessages} onClose={() => setShowDebug(false)} />
      )}
    </div>
  );
};

export default ChatInterface;
