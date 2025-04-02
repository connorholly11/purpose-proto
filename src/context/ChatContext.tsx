import React, { createContext, useState, useContext, ReactNode } from 'react';
import { useApi } from '../hooks/useApi'; // Import the hook

// Message type definition
export type Message = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: string;
};

// Debug response type from backend
type DebugInfo = {
  timestamp: string;
  systemPromptUsedId: string;
  systemPromptUsedName: string;
  summaryContextInjected: string;
};

// ChatContext type definition
type ChatContextType = {
  messages: Message[];
  loading: boolean;
  error: string | null;
  debugInfo: DebugInfo | null; // Add debugInfo state
  sendMessage: (
    content: string,
    overridePromptId?: string, // Add debug option
    requestDebugInfo?: boolean, // Add debug option
    useContext?: boolean // <-- Add context toggle option
  ) => Promise<void>;
  clearMessages: () => void;
};

// Create the context with default values
const ChatContext = createContext<ChatContextType>({
  messages: [],
  loading: false,
  error: null,
  debugInfo: null, // Initialize debugInfo
  sendMessage: async () => {},
  clearMessages: () => {},
});

// Props for the ChatProvider component
type ChatProviderProps = {
  children: ReactNode;
};

// ChatProvider component to wrap the app with chat functionality
export const ChatProvider = ({ children }: ChatProviderProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null); // State for debug info
  
  // API instance
  const api = useApi(); // Use the hook
  
  // Send a message to the AI and get a response
  const sendMessage = async (
    content: string,
    overridePromptId?: string, // Receive debug option
    requestDebugInfo = false, // Receive debug option
    useContext = true // <-- Receive context toggle option (default to true)
  ) => {
    // Don't send if already loading
    if (loading) return;

    try {
      setLoading(true);
      setError(null);
      setDebugInfo(null); // Clear previous debug info
      
      // Generate unique ID for user message
      const userMessageId = `user-${Date.now()}`;
      // Create user message object
      const userMessage: Message = {
        id: userMessageId,
        content,
        role: 'user',
        createdAt: new Date().toISOString(),
      };
      
      // Add user message to the messages array immediately
      setMessages(prevMessages => [...prevMessages, userMessage]);
      
      // Make the API call to get a response, passing debug options
      const response = await api.chat.sendMessage(
        content,
        overridePromptId,
        requestDebugInfo,
        useContext // <-- Pass context toggle to API service
      );
      
      // Create AI message object
      const aiMessage: Message = {
        id: `assistant-${Date.now()}`, // Ensure unique ID
        content: response.reply,
        role: 'assistant',
        createdAt: new Date().toISOString(),
      };
      
      // Add AI message to the messages array
      setMessages(prevMessages => [...prevMessages, aiMessage]);

      // Set debug info if requested and received
      if (requestDebugInfo && response.debugInfo) {
        setDebugInfo(response.debugInfo);
      }

    } catch (err: any) { // Type error for better handling
      console.error('Error sending message:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to get a response from the AI. Please try again.';
      setError(errorMessage);

      // Optionally remove the user message if the API call failed
      // setMessages(prevMessages => prevMessages.filter(msg => msg.id !== userMessageId));

    } finally {
      setLoading(false);
    }
  };
  
  // Clear all messages
  const clearMessages = () => {
    setMessages([]);
    setError(null);
    setDebugInfo(null); // Clear debug info as well
  };
  
  // Context value
  const value = {
    messages,
    loading,
    debugInfo, // Expose debugInfo
    error,
    sendMessage,
    clearMessages,
  };
  
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// Custom hook to use the chat context
export const useChatContext = () => useContext(ChatContext);

export default ChatContext; 