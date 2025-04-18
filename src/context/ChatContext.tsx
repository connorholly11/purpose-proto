import React, { createContext, useState, useContext, ReactNode } from 'react';
import { useApi } from '../hooks/useApi'; // Import the hook

// Message type definition
export type Message = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: string;
  type: 'text';
  // Optional token estimates for cost calculation
  tokenCount?: {
    input?: number;
    output?: number;
  };
  // Optional model name for cost calculation
  modelName?: string;
};

// Debug response type from backend
type DebugInfo = {
  timestamp: string;
  systemPromptUsedId: string;
  systemPromptUsedName: string;
  summaryContextInjected: string;
  modelName?: string;
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  messages?: {
    userMessagePreview?: string;
    aiResponsePreview?: string;
  };
  conversation?: {
    id?: string;
    isNewConversation?: boolean;
    messageCount?: number;
    totalPromptMessages?: number;
  };
  costEstimate?: number;
};

// ChatContext type definition
type ChatContextType = {
  messages: Message[];
  loading: boolean;
  error: string | null;
  debugInfo: DebugInfo | null; // Add debugInfo state
  conversationId: string | null; // Track the current conversation ID
  currentModel: string | null; // Current model being used
  conversationCost: number; // Track the cost of the conversation
  sendMessage: (
    content: string,
    overridePromptId?: string, // Add debug option
    requestDebugInfo?: boolean, // Add debug option
    useContext?: boolean // <-- Add context toggle option
  ) => Promise<void>;
  clearMessages: () => void;
  startNewConversation: () => void; // Method to start a new conversation
};

// Create the context with default values
const ChatContext = createContext<ChatContextType>({
  messages: [],
  loading: false,
  error: null,
  debugInfo: null, // Initialize debugInfo
  conversationId: null, // Initialize conversationId as null
  currentModel: null, // Initialize currentModel as null
  conversationCost: 0, // Initialize conversation cost as 0
  sendMessage: async () => {},
  clearMessages: () => {},
  startNewConversation: () => {}, // Initialize startNewConversation
});

// Props for the ChatProvider component
type ChatProviderProps = {
  children: ReactNode;
};

// ChatProvider component to wrap the app with chat functionality
// Helper function to calculate cost based on model and token count
const calculateCost = (modelName: string, inputTokens: number, outputTokens: number): number => {
  // Convert tokens to millions for calculation
  const inputMillions = inputTokens / 1000000;
  const outputMillions = outputTokens / 1000000;
  
  // Set rates based on model
  if (modelName.toLowerCase().includes('claude')) {
    // Claude 3.5 Sonnet pricing
    const inputRate = 3; // $3 per million tokens
    const outputRate = 15; // $15 per million tokens
    return (inputMillions * inputRate) + (outputMillions * outputRate);
  } else if (modelName.toLowerCase().includes('gpt')) {
    // GPT-4 pricing
    const inputRate = 2.5; // $2.50 per million tokens
    const outputRate = 10; // $10 per million tokens
    return (inputMillions * inputRate) + (outputMillions * outputRate);
  }
  
  // Default pricing for unknown models
  return 0;
};

// Estimate token count for English text
const estimateTokenCount = (text: string): number => {
  // Simple estimate: ~3/4 token per word for English
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount * 1.33);
};

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null); // State for debug info
  const [conversationId, setConversationId] = useState<string | null>(null); // Track current conversation ID
  const [currentModel, setCurrentModel] = useState<string | null>(null); // Track current model
  const [conversationCost, setConversationCost] = useState<number>(0); // Track conversation cost
  
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
    if (loading) {
      console.log('[ChatContext] Skipping message send - already loading');
      return;
    }

    console.log(`[ChatContext] Preparing to send message:
    - Content length: ${content.length} chars
    - Override Prompt ID: ${overridePromptId || 'None'}
    - Request Debug Info: ${requestDebugInfo}
    - Use Context: ${useContext}
    - Current Conversation ID: ${conversationId || 'New conversation'}`);

    try {
      setLoading(true);
      setError(null);
      setDebugInfo(null); // Clear previous debug info
      
      // Generate unique ID for user message with added randomness
      const userMessageId = `user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      console.log(`[ChatContext] Generated user message ID: ${userMessageId}`);
      
      // Estimate token count for user message
      const estimatedUserTokens = estimateTokenCount(content);
      
      // Create user message object with token count
      const userMessage: Message = {
        id: userMessageId,
        content,
        role: 'user',
        createdAt: new Date().toISOString(),
        type: 'text',
        tokenCount: {
          input: estimatedUserTokens
        },
        modelName: currentModel || undefined
      };
      
      // Add user message to the messages array immediately
      console.log('[ChatContext] Adding user message to UI');
      setMessages(prevMessages => {
        const newMessages = [...prevMessages, userMessage];
        console.log(`[ChatContext] After adding user message - array size: ${newMessages.length}`);
        return newMessages;
      });
      
      // Make the API call to get a response, passing debug options and conversationId
      console.log('[ChatContext] Calling API to send message');
      console.log(`[ChatContext] User message content: "${content}"`);
      
      // Set requestDebugInfo to true to get system prompt and model info
      const enhancedDebugInfo = true;
      
      const response = await api.chat.sendMessage(
        content,
        overridePromptId,
        enhancedDebugInfo, // Always request debug info for logging
        useContext, // <-- Pass context toggle to API service
        conversationId // <-- Pass the current conversation ID (null for new)
      );
      
      console.log(`[ChatContext] Response received:
      - Response length: ${response.reply.length} chars
      - Conversation ID: ${response.conversationId}
      - Is New Conversation: ${response.isNewConversation}
      - Debug info included: ${Boolean(response.debugInfo)}`);
      
      // Log AI response content for debugging
      console.log(`[ChatContext] AI response: "${response.reply.substring(0, 100)}${response.reply.length > 100 ? '...' : ''}"`);
      
      // Log system prompt and model information if available
      if (response.debugInfo) {
        console.log(`[ChatContext] System prompt: "${response.debugInfo.systemPromptUsedName}"`);
        console.log(`[ChatContext] Model used: "${response.debugInfo.modelName || 'Default model'}"`);
        console.log(`[ChatContext] Conversation history: ${response.debugInfo.conversation?.messageCount || 0} previous messages`);
        
        // Log if context was injected
        if (response.debugInfo.summaryContextInjected) {
          console.log(`[ChatContext] Context injected: Yes (${response.debugInfo.summaryContextInjected.length} chars)`);
        } else {
          console.log(`[ChatContext] Context injected: No`);
        }
      }
      
      // Always update conversationId from response to ensure consistency
      console.log(`[ChatContext] ${!conversationId ? 'Setting' : 'Updating'} conversation ID to: ${response.conversationId}`);
      setConversationId(response.conversationId);
      
      // Log if this is a new conversation for debugging
      if (response.isNewConversation) {
        console.log(`[ChatContext] Server indicated this is a new conversation`);
      }
      
      // Update current model if available in debug info
      if (response.debugInfo?.modelName) {
        console.log(`[ChatContext] Setting current model to: ${response.debugInfo.modelName}`);
        setCurrentModel(response.debugInfo.modelName);
      }
      
      // Estimate token count for AI response
      const estimatedOutputTokens = estimateTokenCount(response.reply);
      
      // Create AI message object with token count
      const aiMessage: Message = {
        id: `assistant-${Date.now()}-${Math.random().toString(36).slice(2)}`, // Ensure unique ID
        content: response.reply,
        role: 'assistant',
        createdAt: new Date().toISOString(),
        type: 'text', // Default to text type for AI messages
        tokenCount: {
          output: estimatedOutputTokens
        },
        modelName: response.debugInfo?.modelName || currentModel || undefined
      };
      
      // Safely update conversation cost using a try-catch to handle any errors
      try {
        // Update conversation cost if we have debug info with cost estimate
        if (response.debugInfo?.costEstimate) {
          const messageCost = response.debugInfo.costEstimate;
          console.log(`[ChatContext] Server message cost estimate: $${messageCost.toFixed(6)}`);
          
          if (response.debugInfo?.tokenUsage) {
            console.log(`[ChatContext] Token usage: ${response.debugInfo.tokenUsage.promptTokens} prompt tokens, ${response.debugInfo.tokenUsage.completionTokens} completion tokens`);
          }
          
          // Update total conversation cost
          setConversationCost(prevCost => {
            const newCost = prevCost + messageCost;
            console.log(`[ChatContext] Updated conversation cost: $${newCost.toFixed(6)}`);
            return newCost;
          });
        } 
        // Fallback to client-side estimation if no server estimate available
        else if (response.debugInfo?.modelName || currentModel) {
          const modelToUse = response.debugInfo?.modelName || currentModel || '';
          const inputTokens = estimatedUserTokens;
          const outputTokens = estimatedOutputTokens;
          
          // Calculate message cost
          const messageCost = calculateCost(modelToUse, inputTokens, outputTokens);
          console.log(`[ChatContext] Client message cost estimate: $${messageCost.toFixed(6)} (${inputTokens} input tokens, ${outputTokens} output tokens)`);
          
          // Update total conversation cost
          setConversationCost(prevCost => {
            const newCost = prevCost + messageCost;
            console.log(`[ChatContext] Updated conversation cost: $${newCost.toFixed(6)}`);
            return newCost;
          });
        } else {
          // If we can't estimate cost, just log a message
          console.log('[ChatContext] Unable to estimate message cost - insufficient data');
        }
      } catch (costError) {
        // If anything goes wrong in cost calculation, just log and continue
        console.error('[ChatContext] Error calculating message cost:', costError);
      }
      
      // Add AI message to the messages array
      console.log('[ChatContext] Adding AI response to UI');
      setMessages(prevMessages => {
        const newMessages = [...prevMessages, aiMessage];
        console.log(`[ChatContext] Updated messages array size: ${newMessages.length}`);
        console.log(`[ChatContext] Latest message ID: ${aiMessage.id}`);
        return newMessages;
      });

      // Set debug info if requested and received
      if (requestDebugInfo && response.debugInfo) {
        console.log('[ChatContext] Setting debug info in state');
        setDebugInfo(response.debugInfo);
      }

    } catch (err: any) { // Type error for better handling
      console.error('[ChatContext] Error sending message:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to get a response from the AI. Please try again.';
      console.error(`[ChatContext] Setting error: ${errorMessage}`);
      setError(errorMessage);

      // Optionally remove the user message if the API call failed
      // setMessages(prevMessages => prevMessages.filter(msg => msg.id !== userMessageId));

    } finally {
      console.log('[ChatContext] Message exchange complete, setting loading to false');
      setLoading(false);
    }
  };
  
  // Clear all messages
  const clearMessages = () => {
    setMessages([]);
    setError(null);
    setDebugInfo(null); // Clear debug info as well
  };
  
  // Start a new conversation
  const startNewConversation = () => {
    console.log('[ChatContext] Starting new conversation - resetting state');
    console.log(`[ChatContext] Previous conversation ID: ${conversationId || 'None'}`);
    
    setConversationId(null); // This will signal the backend to start a fresh conversation
    setMessages([]); // Clear the UI
    setError(null);
    setDebugInfo(null);
    setConversationCost(0); // Reset conversation cost
    // Keep the current model info for the next conversation
    
    console.log('[ChatContext] State reset complete for new conversation');
  };
  
  // Context value
  const value = {
    messages,
    loading,
    debugInfo, // Expose debugInfo
    error,
    conversationId, // Expose conversationId
    currentModel, // Expose current model
    conversationCost, // Expose conversation cost
    sendMessage,
    clearMessages,
    startNewConversation, // Expose method to start a new conversation
  };
  
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// Custom hook to use the chat context
export const useChatContext = () => useContext(ChatContext);

export default ChatContext; 