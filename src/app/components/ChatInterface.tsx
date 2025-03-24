'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaMicrophone, FaUser } from 'react-icons/fa';
import AudioRecorder from './AudioRecorder';
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
  const [debugMessages, setDebugMessages] = useState<DebugMessage[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Keep track of user conversations
  const [userConversations, setUserConversations] = useState<Record<string, string>>({});
  const [systemPrompts, setSystemPrompts] = useState<any[]>([]);
  const [activePrompt, setActivePrompt] = useState<any | null>(null);
  const [showPromptSelector, setShowPromptSelector] = useState(false);
  const [showMemory, setShowMemory] = useState(false);

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

  // Fetch system prompts on mount
  useEffect(() => {
    const fetchSystemPrompts = async () => {
      try {
        const response = await fetch('/api/system-prompts');
        if (response.ok) {
          const data = await response.json();
          setSystemPrompts(data.prompts || []);
          // Set default prompt (if any)
          const defaultPrompt = data.prompts?.find((p: any) => p.isDefault);
          if (defaultPrompt) {
            setActivePrompt(defaultPrompt);
          }
        }
      } catch (error) {
        console.error('Error fetching system prompts:', error);
      }
    };

    fetchSystemPrompts();
  }, []);

  const createNewConversation = async () => {
    try {
      setDebugMessages(prev => [
        ...prev,
        { timestamp: new Date(), actionType: 'CREATE_CONVERSATION', details: `Creating new conversation` }
      ]);
      
      if (!currentUser) {
        console.error('Cannot create conversation: No user selected');
        return;
      }
      
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          userId: currentUser.id
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConversationId(data.id);
        
        // Also store this conversation ID for this user
        setUserConversations(prev => ({
          ...prev,
          [currentUser.id]: data.id
        }));
        
        // Clear messages
        setMessages([]);
        
        setDebugMessages(prev => [
          ...prev,
          { 
            timestamp: new Date(), 
            actionType: 'CONVERSATION_CREATED', 
            details: `New conversation created: ${data.id}` 
          }
        ]);
      } else {
        console.error('Failed to create new conversation');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleNewChat = async () => {
    await createNewConversation();
  };

  const loadConversation = async (id: string) => {
    try {
      if (!currentUser) {
        console.error('Cannot load conversation: No user selected');
        return;
      }
      
      setDebugMessages(prev => [
        ...prev,
        { timestamp: new Date(), actionType: 'LOAD_CONVERSATION', details: `Loading conversation: ${id}` }
      ]);
      
      const response = await fetch(`/api/messages?conversationId=${id}`, {
        headers: {
          'x-user-id': currentUser.id
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
          setTimeout(scrollToBottom, 100);
          
          setDebugMessages(prev => [
            ...prev,
            { 
              timestamp: new Date(), 
              actionType: 'CONVERSATION_LOADED', 
              details: `Loaded ${data.messages.length} messages from conversation: ${id}` 
            }
          ]);
        }
      } else {
        console.error('Failed to load conversation messages');
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      await handleSendMessage();
    }
  };

  const handleTranscription = (transcript: string) => {
    if (transcript.trim()) {
      handleUserMessage(transcript);
    }
  };

  const handleLikeMessage = async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback: 'like' }),
      });
    } catch (error) {
      console.error('Error giving feedback:', error);
    }
  };

  const handleDislikeMessage = async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback: 'dislike' }),
      });
    } catch (error) {
      console.error('Error giving feedback:', error);
    }
  };

  const setSystemPrompt = async (promptId: string) => {
    try {
      const selectedPrompt = systemPrompts.find(p => p.id === promptId);
      if (!selectedPrompt) return;
      
      setActivePrompt(selectedPrompt);
      setShowPromptSelector(false);
      
      // Optionally notify backend of prompt change
      if (conversationId) {
        await fetch(`/api/conversations/${conversationId}/system-prompt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ promptId }),
        });
      }
      
      // Show a system message about the prompt change
      const systemMessage: MessageType = {
        id: `system-${Date.now()}`,
        role: 'system',
        content: `Changed AI personality to: ${selectedPrompt.name}`,
        conversationId: conversationId || '',
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, systemMessage]);
    } catch (error) {
      console.error('Error setting system prompt:', error);
    }
  };

  const handleUserMessage = async (message: string) => {
    if (!message.trim() || isProcessing || !conversationId) return;
    
    setIsProcessing(true);
    
    try {
      setDebugMessages(prev => [
        ...prev,
        { timestamp: new Date(), actionType: 'USER_MESSAGE', details: `User sent: ${message.substring(0, 50)}...` }
      ]);
      
      // Add user message to the UI immediately
      const userMessage: MessageType = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: message,
        conversationId,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInput(''); // Clear input
      setTimeout(scrollToBottom, 50);
      
      // Create placeholder for AI response
      const placeholderMessage: MessageType = {
        id: `placeholder-${Date.now()}`,
        role: 'assistant',
        content: '...',
        conversationId,
        timestamp: new Date().toISOString(),
        isLoading: true,
      };
      
      setMessages(prev => [...prev, placeholderMessage]);
      setTimeout(scrollToBottom, 50);
      
      // Send the message to the API
      const response = await sendMessageToAPI(message, conversationId);
      
      // Check if summarization is needed
      if (shouldSummarize(messages)) {
        // Show a system message about summarization
        const summaryNotice: MessageType = {
          id: `summary-notice-${Date.now()}`,
          role: 'system',
          content: 'Summarizing conversation to maintain context...',
          conversationId,
          timestamp: new Date().toISOString(),
        };
        
        setMessages(prev => [...prev, summaryNotice]);
        setTimeout(scrollToBottom, 50);
        
        try {
          // Request summarization
          const summaryResponse = await fetch(`/api/conversations/${conversationId}/summarize`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': currentUser?.id || ''
            },
          });
          
          if (summaryResponse.ok) {
            const summaryResult = await summaryResponse.json();
            // Optionally show summary result
            setDebugMessages(prev => [
              ...prev,
              { 
                timestamp: new Date(), 
                actionType: 'SUMMARIZATION', 
                details: `Conversation summarized: ${summaryResult.success ? 'success' : 'failed'}` 
              }
            ]);
          }
        } catch (summaryError) {
          console.error('Error during summarization:', summaryError);
        }
      }
      
      // Remove placeholder and add real AI response
      if (response && response.message) {
        setMessages(prev => 
          prev.filter(m => m.id !== placeholderMessage.id).concat([
            {
              ...response.message,
              feedback: null,
            }
          ])
        );
      } else {
        // If something went wrong, replace the placeholder with an error message
        setMessages(prev => 
          prev.map(m => 
            m.id === placeholderMessage.id 
              ? {
                  ...m,
                  content: "I'm sorry, I couldn't process your request. Please try again.",
                  isLoading: false,
                } 
              : m
          )
        );
      }
      
      setTimeout(scrollToBottom, 50);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update placeholder with error message
      setMessages(prev => 
        prev.map(m => 
          m.isLoading 
            ? {
                ...m,
                content: "I'm sorry, I encountered an error. Please try again.",
                isLoading: false,
              } 
            : m
        )
      );
    } finally {
      setIsProcessing(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  const togglePromptSelector = () => {
    setShowPromptSelector(!showPromptSelector);
  };

  const handleSendMessage = async (textContent: string = input) => {
    await handleUserMessage(textContent);
  };

  const sendMessageToAPI = async (content: string, convId: string) => {
    if (!currentUser) {
      console.error('Cannot send message: No user selected');
      return null;
    }
    
    try {
      setDebugMessages(prev => [
        ...prev,
        { timestamp: new Date(), actionType: 'API_REQUEST', details: `Sending message to API` }
      ]);
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          content,
          conversationId: convId,
          systemPromptId: activePrompt?.id,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        setDebugMessages(prev => [
          ...prev,
          { 
            timestamp: new Date(), 
            actionType: 'API_RESPONSE', 
            details: `Received AI response: ${data.message?.content?.substring(0, 50)}...` 
          }
        ]);
        
        return data;
      } else {
        const errorText = await response.text();
        console.error('API error:', response.status, errorText);
        return null;
      }
    } catch (error) {
      console.error('Error in API request:', error);
      return null;
    }
  };

  return (
    <div className="flex flex-col h-full flex-1">
      <div className="relative flex-1 overflow-y-auto scrollbar-thin px-2 sm:px-4 pt-2 pb-20">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-10">
            <div className="text-5xl mb-4">💬</div>
            <h2 className="text-xl font-semibold mb-2">Welcome to AI Companion</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
              Start a conversation with your AI assistant. Ask questions, get help, or just chat!
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <Message 
            key={message.id} 
            message={message}
            showAvatar={index === 0 || messages[index - 1]?.role !== message.role}
            onLike={() => handleLikeMessage(message.id)}
            onDislike={() => handleDislikeMessage(message.id)}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area sticky at the bottom */}
      <div className="sticky bottom-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-slate-700/50 pt-2 pb-4 px-2 sm:px-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-2 relative">
          <div className="relative flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="w-full rounded-2xl border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 pr-12 resize-none leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 shadow-sm transition-all duration-200"
              style={{ minHeight: '3rem', maxHeight: '8rem' }}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className={`absolute right-3 bottom-2.5 text-white p-1.5 rounded-full transition-all ${
                !input.trim() || isProcessing 
                  ? 'bg-gray-400 dark:bg-gray-600' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              <FaPaperPlane size={14} />
            </button>
          </div>
          
          <AudioRecorder
            onTranscription={handleTranscription}
            onRecordingStateChange={setIsRecording}
            disabled={isProcessing}
          />
        </form>

        {/* Debug panel toggle */}
        <div className="mt-2 flex justify-center">
          <button 
            onClick={() => setShowDebug(!showDebug)} 
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            {showDebug ? 'Hide Debug' : 'Show Debug'}
          </button>
          {activePrompt && (
            <button
              onClick={togglePromptSelector}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 ml-4"
            >
              {showPromptSelector ? 'Hide Prompts' : `Prompt: ${activePrompt.name}`}
            </button>
          )}
        </div>
      </div>

      {/* Prompt selector */}
      {showPromptSelector && (
        <div className="fixed inset-x-0 bottom-20 bg-white dark:bg-slate-800 shadow-lg rounded-t-lg p-4 z-10 transition-all duration-300">
          <h3 className="text-lg font-semibold mb-2">Select AI Personality</h3>
          <div className="grid grid-cols-2 gap-2">
            {systemPrompts.map(prompt => (
              <button
                key={prompt.id}
                onClick={() => setSystemPrompt(prompt.id)}
                className={`p-2 rounded text-left text-sm ${
                  activePrompt?.id === prompt.id 
                    ? 'bg-blue-100 dark:bg-blue-900 border-blue-500 border' 
                    : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                <div className="font-medium">{prompt.name}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                  {prompt.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Debug panel */}
      {showDebug && (
        <DebugPanel messages={debugMessages} />
      )}

      {/* Memory manager */}
      {showMemory && conversationId && (
        <MemoryManager
          conversationId={conversationId}
          onClose={() => setShowMemory(false)}
        />
      )}
    </div>
  );
};

export default ChatInterface;
