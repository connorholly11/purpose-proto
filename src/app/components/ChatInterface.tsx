'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaMicrophone, FaRobot, FaUser, FaCog } from 'react-icons/fa';
import AudioRecorder from './AudioRecorder';
import RealtimeVoice from './RealtimeVoice';
import Message from './Message';
import { Message as MessageType } from '@/types';
import browserLogger from '@/lib/utils/browser-logger';
import { useUser } from '@/app/contexts/UserContext';

interface ChatInterfaceProps {
  initialConversationId?: string;
}

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
  const [systemPrompts, setSystemPrompts] = useState<any[]>([]);
  const [activePrompt, setActivePrompt] = useState<any | null>(null);
  const [showPromptSelector, setShowPromptSelector] = useState(false);

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

  // Initialize or load conversation
  useEffect(() => {
    if (!conversationId) {
      initializeConversation();
    } else {
      loadConversation(conversationId);
    }
  }, [conversationId]);

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

  // If user changes, reset conversation
  useEffect(() => {
    setMessages([]);
    setConversationId(undefined);
    initializeConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

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
  // create conversation
  // ---------------------------------------
  const initializeConversation = async () => {
    try {
      if (!currentUser?.id) {
        // If you need a user to create a conversation, handle it or skip
        browserLogger.warn('ChatInterface', 'No currentUser found, conversation will be guest-based');
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (currentUser) {
        headers['x-user-id'] = currentUser.id;
      }

      // Updated to call POST /api/conversations (not /create)
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        browserLogger.error('ChatInterface', 'Failed to create conversation', {
          status: response.status
        });
        throw new Error('Failed to create conversation');
      }

      const data = await response.json();
      browserLogger.info('ChatInterface', 'Conversation created', { conversationId: data.id });
      setConversationId(data.id);
    } catch (error) {
      browserLogger.error('ChatInterface', 'Error creating conversation', {
        error: (error as Error).message,
      });
      console.error('Error creating conversation:', error);
    }
  };

  // ---------------------------------------
  // load conversation
  // ---------------------------------------
  const loadConversation = async (id: string) => {
    try {
      // Use the existing dynamic route: /api/conversations/[id]
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

    const userMessage = input.trim();
    setInput('');
    setIsProcessing(true);

    // Add user message to local state
    const newUserMessage: MessageType = {
      id: `temp-${Date.now()}`,
      conversationId: conversationId || '',
      role: 'user',
      content: userMessage,
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      // 1) Call RAG service
      const ragResponse = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      // 2) Get AI completion
      const completionResponse = await fetch('/api/completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      // Add AI message
      const newAiMessage: MessageType = {
        id: `temp-response-${Date.now()}`,
        conversationId: conversationId || '',
        role: 'assistant',
        content: answer,
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, newAiMessage]);

      // Optionally generate TTS
      if (responseMode === 'voice') {
        await generateSpeech(answer);
      }
    } catch (error) {
      console.error('Error processing message:', error);
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
      }
    } catch (error) {
      console.error('Error generating speech:', error);
    }
  };

  // handle transcription from short audio recordings
  const handleTranscription = (transcript: string) => {
    setInput(transcript);
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
  };

  // partial transcripts from Realtime
  const handlePartialTranscript = (transcript: string) => {
    setRealtimeTranscript(transcript);
  };

  // NEW: handle final transcript from Realtime voice
  const handleRealtimeUserMessage = async (transcript: string) => {
    // Functionality commented out
    console.log('Real-time voice feature is currently disabled');
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
        body: JSON.stringify({
          status: 'active'
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setActivePrompt(data.systemPrompt);
        setShowPromptSelector(false);
      }
    } catch (error) {
      console.error('Error setting system prompt:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Top bar */}
      <div className="bg-gray-800 text-white p-3 flex justify-between items-center">
        <div className="flex items-center">
          <FaRobot className="mr-2" />
          <span className="text-sm">
            {activePrompt ? activePrompt.name : 'Default System Prompt'}
          </span>
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
                disabled={isProcessing || !input.trim()}
              >
                <FaPaperPlane />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
