'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaMicrophone, FaRobot, FaUser } from 'react-icons/fa';
import AudioRecorder from './AudioRecorder';
import RealtimeVoice from './RealtimeVoice';
import Message from './Message';
import { Message as MessageType } from '@/types';
import { createConversation, createMessage } from '@/lib/services/prisma';
import { useUser } from '../contexts/UserContext';
import { getCompletion } from '@/lib/services/openai';
import browserLogger from '@/lib/utils/browser-logger';

interface ChatInterfaceProps {
  initialConversationId?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ initialConversationId }) => {
  const { currentUser } = useUser();
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [showRealtimeVoice, setShowRealtimeVoice] = useState(false);
  const [aiAudio, setAiAudio] = useState<string | null>(null);
  const [responseMode, setResponseMode] = useState<'text' | 'voice'>('voice');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [realtimeTranscript, setRealtimeTranscript] = useState<string | null>(null);
  
  // Loading from localStorage on mount
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
  
  // Initialize conversation if needed
  useEffect(() => {
    if (!conversationId) {
      initializeConversation();
    } else {
      // Load existing conversation
      loadConversation(conversationId);
    }
  }, [conversationId]);
  
  // Scroll to bottom of messages
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
  
  // Reset and initialize conversation when user changes
  useEffect(() => {
    // Clear current state
    setMessages([]);
    setConversationId(undefined);
    
    // Initialize a new conversation for this user
    initializeConversation();
  }, [currentUser]);
  
  // Initialize a new conversation
  const initializeConversation = async () => {
    try {
      browserLogger.info('ChatInterface', 'Initializing conversation', { userId: currentUser?.id });
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add user ID if available
      if (currentUser) {
        headers['x-user-id'] = currentUser.id;
      }
      
      browserLogger.debug('ChatInterface', 'Calling /api/conversation', { headers });
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers,
      });
      
      if (!response.ok) {
        browserLogger.error('ChatInterface', 'Failed to create conversation', { status: response.status });
        throw new Error('Failed to create conversation');
      }
      
      const data = await response.json();
      browserLogger.info('ChatInterface', 'Conversation created', { conversationId: data.id });
      setConversationId(data.id);
    } catch (error) {
      browserLogger.error('ChatInterface', 'Error creating conversation', { error: (error as Error).message });
      console.error('Error creating conversation:', error);
    }
  };
  
  // Load existing conversation messages
  const loadConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/conversation/${id}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to load conversation');
      }
      
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Handle user input submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isProcessing || !conversationId) return;
    
    const userMessage = input.trim();
    browserLogger.info('ChatInterface', 'Processing user message', { 
      conversationId,
      messageLength: userMessage.length,
      preview: userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : '')
    });
    
    setInput('');
    setIsProcessing(true);
    
    // Add user message to UI
    const newUserMessage: MessageType = {
      id: `temp-${Date.now()}`,
      conversationId,
      role: 'user',
      content: userMessage,
      createdAt: new Date(),
    };
    
    browserLogger.debug('ChatInterface', 'Adding user message to UI');
    setMessages(prev => [...prev, newUserMessage]);
    
    try {
      // Use the new RAG service API endpoint
      browserLogger.debug('ChatInterface', 'Calling RAG service', { conversationId });
      const startRagTime = Date.now();
      const ragResponse = await fetch('/api/rag-service', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage,
          topK: 5,
          source: 'chat',
          conversationId
        }),
      });
      
      if (!ragResponse.ok) {
        browserLogger.error('ChatInterface', 'RAG processing failed', { status: ragResponse.status });
        throw new Error(`RAG processing failed: ${ragResponse.status}`);
      }
      
      const ragResult = await ragResponse.json();
      const ragDuration = Date.now() - startRagTime;
      browserLogger.info('ChatInterface', 'RAG processing complete', { 
        ragDuration,
        matchCount: ragResult.matches?.length || 0,
        contextLength: ragResult.context?.length || 0
      });
      
      // Get AI response with context
      browserLogger.debug('ChatInterface', 'Calling completion API', { conversationId });
      const startCompletionTime = Date.now();
      const completionResponse = await fetch('/api/completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMessage }],
          context: ragResult.context,
          conversationId
        }),
      });
      
      if (!completionResponse.ok) {
        browserLogger.error('ChatInterface', 'Completion failed', { status: completionResponse.status });
        throw new Error(`Completion failed: ${completionResponse.status}`);
      }
      
      const { answer } = await completionResponse.json();
      const completionDuration = Date.now() - startCompletionTime;
      browserLogger.info('ChatInterface', 'Completion received', { 
        completionDuration,
        answerLength: answer.length
      });
      
      // Add AI response to UI
      const newAiMessage: MessageType = {
        id: `temp-response-${Date.now()}`,
        conversationId,
        role: 'assistant',
        content: answer,
        createdAt: new Date(),
      };
      
      browserLogger.debug('ChatInterface', 'Adding AI response to UI');
      setMessages(prev => [...prev, newAiMessage]);
      
      // Generate speech for the answer
      browserLogger.debug('ChatInterface', 'Generating speech', { responseMode });
      generateSpeech(answer);
    } catch (error) {
      browserLogger.error('ChatInterface', 'Error processing message', { error: (error as Error).message });
      console.error('Error processing message:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Generate speech for AI response only if in voice mode
  const generateSpeech = async (text: string) => {
    if (responseMode === 'text') {
      browserLogger.debug('ChatInterface', 'Skipping speech generation (text-only mode)');
      return; // Skip speech generation in text-only mode
    }

    try {
      browserLogger.debug('ChatInterface', 'Calling TTS API', { textLength: text.length });
      const startTtsTime = Date.now();
      const ttsResponse = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!ttsResponse.ok) {
        browserLogger.error('ChatInterface', 'TTS API error', { status: ttsResponse.status });
        console.error(`TTS API error: ${ttsResponse.status}`);
        return;
      }
      
      const { audioContent } = await ttsResponse.json();
      const ttsDuration = Date.now() - startTtsTime;
      
      if (audioContent) {
        browserLogger.info('ChatInterface', 'TTS generation complete', { 
          ttsDuration,
          audioContentLength: audioContent.length
        });
        setAiAudio(audioContent);
      } else {
        browserLogger.warn('ChatInterface', 'No audio content returned from TTS API');
      }
    } catch (error) {
      browserLogger.error('ChatInterface', 'Error generating speech', { error: (error as Error).message });
      console.error('Error generating speech:', error);
      // Continue without audio if TTS fails
    }
  };
  
  // Handle transcription from audio recorder
  const handleTranscription = (transcript: string) => {
    setInput(transcript);
  };
  
  // Handle AI response from audio recorder
  const handleAudioAIResponse = (answer: string, audioContent: string) => {
    // Add user message from transcription
    const newUserMessage: MessageType = {
      id: `temp-${Date.now()}`,
      conversationId: conversationId || '',
      role: 'user',
      content: input,
      createdAt: new Date(),
    };
    
    // Add AI response
    const newAiMessage: MessageType = {
      id: `temp-response-${Date.now()}`,
      conversationId: conversationId || '',
      role: 'assistant',
      content: answer,
      createdAt: new Date(),
    };
    
    setMessages(prev => [...prev, newUserMessage, newAiMessage]);
    setAiAudio(audioContent);
    setInput('');
  };
  
  // Callback for partial transcripts from RealtimeVoice
  const handlePartialTranscript = (transcript: string) => {
    setRealtimeTranscript(transcript);
  };
  
  // Callback for completed transcripts from RealtimeVoice
  const handleCompletedTranscript = (transcript: string) => {
    // Add the user message to the UI when transcript is complete
    if (transcript && conversationId) {
      const newUserMessage: MessageType = {
        id: `temp-${Date.now()}`,
        conversationId,
        role: 'user',
        content: transcript,
        createdAt: new Date(),
      };
      
      setMessages(prev => [...prev, newUserMessage]);
      setRealtimeTranscript(null);
    }
  };
  
  // Handle like/dislike of messages
  const handleLikeMessage = async (messageId: string) => {
    try {
      await fetch(`/api/message/${messageId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback: 'like' }),
      });
    } catch (error) {
      console.error('Error liking message:', error);
    }
  };
  
  const handleDislikeMessage = async (messageId: string) => {
    try {
      await fetch(`/api/message/${messageId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback: 'dislike' }),
      });
    } catch (error) {
      console.error('Error disliking message:', error);
    }
  };
  
  // Toggle between text and voice modes
  const toggleResponseMode = () => {
    setResponseMode(prev => prev === 'text' ? 'voice' : 'text');
  };
  
  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center p-4 border-b">
        <h1 className="text-xl font-semibold">AI Voice Companion</h1>
        <div className="flex items-center space-x-4">
          {/* Response Mode Toggle */}
          <div className="flex items-center">
            <span className="text-sm mr-2">Response Mode:</span>
            <button
              onClick={toggleResponseMode}
              className="px-3 py-1 rounded-md text-sm font-medium bg-gray-100 hover:bg-gray-200"
            >
              {responseMode === 'voice' ? 'Voice' : 'Text'} 
              <span className="ml-1 text-xs opacity-60">▼</span>
            </button>
          </div>

          {/* Existing Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setShowAudioRecorder(!showAudioRecorder);
                setShowRealtimeVoice(false);
              }}
              className={`p-2 rounded-md ${
                showAudioRecorder ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Short Audio
            </button>
            <button
              onClick={() => {
                setShowRealtimeVoice(!showRealtimeVoice);
                setShowAudioRecorder(false);
              }}
              className={`p-2 rounded-md ${
                showRealtimeVoice ? 'bg-green-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Realtime Voice
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <Message 
            key={message.id} 
            message={message} 
            onLike={() => handleLikeMessage(message.id)}
            onDislike={() => handleDislikeMessage(message.id)}
          />
        ))}
        
        {/* Show realtime transcript if available */}
        {realtimeTranscript && (
          <div className="mb-4 text-right animate-pulse">
            <div className="inline-block p-3 bg-blue-300 text-white rounded-lg rounded-tr-none max-w-[80%]">
              {realtimeTranscript}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {showAudioRecorder ? (
        <div className="p-4 border-t">
          <AudioRecorder
            onTranscription={handleTranscription}
            onAIResponse={handleAudioAIResponse}
            conversationId={conversationId}
          />
        </div>
      ) : showRealtimeVoice ? (
        <div className="p-4 border-t">
          <RealtimeVoice
            onPartialTranscript={handlePartialTranscript}
            onCompletedTranscript={handleCompletedTranscript}
            conversationId={conversationId}
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isProcessing}
            />
            <button
              type="submit"
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50"
              disabled={!input.trim() || isProcessing}
            >
              <FaPaperPlane />
            </button>
            <button
              type="button"
              onClick={() => setShowAudioRecorder(true)}
              className="p-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
            >
              <FaMicrophone />
            </button>
          </div>
        </form>
      )}
      
      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

export default ChatInterface; 