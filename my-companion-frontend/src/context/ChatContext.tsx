'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ChatMessage, ChatResponse, LogEntry, fetchLogs, rateConversation, sendChatMessage } from '@/services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  llmUsed?: string;
  timestamp: string;
  rating?: boolean | null;
}

interface ChatContextType {
  messages: Message[];
  isLoading: boolean;
  systemPromptMode: 'friendly' | 'challenging';
  sendMessage: (content: string) => Promise<void>;
  rateMessage: (id: string, rating: boolean) => Promise<void>;
  setSystemPromptMode: (mode: 'friendly' | 'challenging') => void;
  error: string | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [systemPromptMode, setSystemPromptMode] = useState<'friendly' | 'challenging'>('friendly');
  const [error, setError] = useState<string | null>(null);

  // Load conversation history on initial render
  useEffect(() => {
    const loadConversationHistory = async () => {
      try {
        setIsLoading(true);
        const logs = await fetchLogs();
        
        // Convert logs to messages format
        const convertedMessages = logs.map((log: LogEntry) => [
          {
            id: `${log.id}-user`,
            role: 'user' as const,
            content: log.userMessage,
            timestamp: log.timestamp,
          },
          {
            id: log.id,
            role: 'assistant' as const,
            content: log.aiResponse,
            llmUsed: log.llmUsed,
            timestamp: log.timestamp,
            rating: log.rating,
          },
        ]).flat();
        
        setMessages(convertedMessages);
      } catch (error) {
        console.error('Error loading conversation history:', error);
        setError('Failed to load conversation history');
      } finally {
        setIsLoading(false);
      }
    };

    loadConversationHistory();
  }, []);

  const sendMessage = async (content: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Add user message to state immediately
      const userMessageId = Date.now().toString() + '-user';
      const userMessage: Message = {
        id: userMessageId,
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };
      
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      
      // Send message to API
      const chatMessage: ChatMessage = {
        userId: 'user', // In a real app, this would be a real user ID
        message: content,
        systemPromptMode,
      };
      
      try {
        const response: ChatResponse = await sendChatMessage(chatMessage);
        
        // Add assistant response to state
        const assistantMessage: Message = {
          id: response.id,
          role: 'assistant',
          content: response.response,
          llmUsed: response.llmUsed,
          timestamp: new Date().toISOString(),
          rating: null,
        };
        
        setMessages((prevMessages) => [...prevMessages, assistantMessage]);
        
        // Display warning if present in response
        if (response.warning) {
          setError(response.warning);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        let errorMessage = 'Failed to send message. Please try again.';
        
        if (error instanceof Error) {
          if ('message' in error) {
            if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
              errorMessage = 'Network error: Unable to connect to the server. Please check your internet connection and try again.';
            } else if (error.message.includes('timeout')) {
              errorMessage = 'Request timed out. The server might be busy, please try again later.';
            }
          }
        }
        
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Unexpected error in sendMessage:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const rateMessage = async (id: string, rating: boolean) => {
    try {
      // Update local state first for immediate feedback
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === id ? { ...msg, rating } : msg
        )
      );
      
      // Send rating to API
      try {
        await rateConversation({ id, rating });
      } catch (error) {
        console.error('Error rating message:', error);
        let errorMessage = 'Failed to rate message';
        
        if (error instanceof Error) {
          if ('message' in error) {
            if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
              errorMessage = 'Network error: Unable to connect to the server. Your rating was saved locally but not synced.';
            }
          }
        }
        
        setError(errorMessage);
        
        // Don't revert the local state, keep the user's rating visible
        // but inform them of the sync issue
      }
    } catch (error) {
      console.error('Unexpected error in rateMessage:', error);
      setError('An unexpected error occurred while rating the message.');
      
      // Revert local state on unexpected errors
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === id ? { ...msg, rating: null } : msg
        )
      );
    }
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        isLoading,
        systemPromptMode,
        sendMessage,
        rateMessage,
        setSystemPromptMode,
        error,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
