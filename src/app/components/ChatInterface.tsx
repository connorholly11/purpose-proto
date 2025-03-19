'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaMicrophone, FaRobot, FaUser } from 'react-icons/fa';
import AudioRecorder from './AudioRecorder';
import RealtimeVoice from './RealtimeVoice';
import Message from './Message';
import { Message as MessageType } from '@/types';
import { createConversation, createMessage } from '@/lib/services/prisma';

interface ChatInterfaceProps {
  initialConversationId?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ initialConversationId }) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [showRealtimeVoice, setShowRealtimeVoice] = useState(false);
  const [aiAudio, setAiAudio] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
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
  
  // Initialize a new conversation
  const initializeConversation = async () => {
    try {
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }
      
      const data = await response.json();
      setConversationId(data.id);
    } catch (error) {
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
    
    setMessages(prev => [...prev, newUserMessage]);
    
    try {
      // Send to RAG API
      const ragResponse = await fetch('/api/rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-conversation-id': conversationId,
        },
        body: JSON.stringify({ userQuery: userMessage }),
      });
      
      if (!ragResponse.ok) {
        throw new Error(`RAG processing failed: ${ragResponse.status}`);
      }
      
      const { answer } = await ragResponse.json();
      
      // Add AI response to UI
      const newAiMessage: MessageType = {
        id: `temp-response-${Date.now()}`,
        conversationId,
        role: 'assistant',
        content: answer,
        createdAt: new Date(),
      };
      
      setMessages(prev => [...prev, newAiMessage]);
      
      // Generate speech for the answer
      generateSpeech(answer);
    } catch (error) {
      console.error('Error processing message:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Generate speech for AI response
  const generateSpeech = async (text: string) => {
    try {
      const ttsResponse = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!ttsResponse.ok) {
        throw new Error(`TTS failed: ${ttsResponse.status}`);
      }
      
      const { audioContent } = await ttsResponse.json();
      setAiAudio(audioContent);
    } catch (error) {
      console.error('Error generating speech:', error);
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
  
  // Handle partial transcript from realtime voice
  const handlePartialTranscript = (text: string) => {
    // Optionally update UI with partial transcript
  };
  
  // Handle partial response from realtime voice
  const handlePartialResponse = (text: string) => {
    // Optionally update UI with partial response
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
  
  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center p-4 border-b">
        <h1 className="text-xl font-semibold">AI Voice Companion</h1>
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
      
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <Message 
            key={message.id} 
            message={message} 
            onLike={() => handleLikeMessage(message.id)}
            onDislike={() => handleDislikeMessage(message.id)}
          />
        ))}
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
            onPartialResponse={handlePartialResponse}
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