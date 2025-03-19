'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  sendChatMessage, 
  textToSpeech, 
  getConversations,
  getConversationMessages,
  ChatRequest, 
  Conversation,
  Message as ApiMessage
} from '@/services/api';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  llmUsed?: string;
}

interface ChatInterfaceProps {
  initialSystemPromptMode?: 'friendly' | 'challenging';
  initialVoiceMode?: boolean;
}

export default function ChatInterface({
  initialSystemPromptMode = 'friendly',
  initialVoiceMode = false,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemPromptMode, setSystemPromptMode] = useState<'friendly' | 'challenging'>(initialSystemPromptMode);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [userId] = useState<string>(`user-${Date.now()}`); // Simple user ID for demo
  const [showConversations, setShowConversations] = useState(false);
  const [voiceMode, setVoiceMode] = useState<boolean>(initialVoiceMode);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const realtimeConnectionRef = useRef<WebSocket | null>(null);

  // Load user conversations on mount
  useEffect(() => {
    fetchUserConversations();
  }, []);

  // Fetch user conversations
  const fetchUserConversations = async () => {
    try {
      const userConversations = await getConversations(userId);
      setConversations(userConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  // Load conversation messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadConversationMessages(currentConversationId);
    }
  }, [currentConversationId]);

  // Load messages for a specific conversation
  const loadConversationMessages = async (conversationId: string) => {
    try {
      setIsLoading(true);
      const conversationMessages = await getConversationMessages(conversationId);
      
      // Convert API messages to our local format
      const formattedMessages: Message[] = conversationMessages.map(message => ({
        id: message.id,
        role: message.role,
        content: message.content,
        llmUsed: message.llmUsed
      }));
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading conversation messages:', error);
      setMessages([{ 
        role: 'assistant', 
        content: 'Failed to load conversation history. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Select a conversation
  const selectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    setShowConversations(false);
  };

  // Create a new conversation
  const startNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setShowConversations(false);
  };

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Play audio when audioUrl changes
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      setIsPlayingAudio(true);
      audioRef.current.play()
        .catch(error => console.error('Error playing audio:', error))
        .finally(() => setIsPlayingAudio(false));
    }
  }, [audioUrl]);

  // Focus input field when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Clean up Realtime connection on unmount
  useEffect(() => {
    return () => {
      if (realtimeConnectionRef.current) {
        realtimeConnectionRef.current.close();
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Add user message to chat
    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Send message to API
      const chatRequest: ChatRequest = {
        message: input,
        systemPromptMode,
        userId: userId,
        conversationId: currentConversationId || undefined
      };
      
      const response = await sendChatMessage(chatRequest);
      
      // Set the conversation ID if this is a new conversation
      if (!currentConversationId) {
        setCurrentConversationId(response.conversationId);
        // Refresh conversations list
        fetchUserConversations();
      }
      
      // Add assistant message to chat
      const assistantMessage: Message = {
        id: response.id,
        role: 'assistant',
        content: response.response,
        llmUsed: response.llmUsed,
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      
      // Convert response to speech (if TTS is implemented)
      try {
        const ttsResponse = await textToSpeech({ text: response.response });
        if (ttsResponse.audioUrl) {
          setAudioUrl(ttsResponse.audioUrl);
        }
      } catch (error) {
        console.error('Error converting text to speech:', error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, there was an error processing your request. Please try again later.' },
      ]);
    } finally {
      setIsLoading(false);
      // Focus input field after sending message
      inputRef.current?.focus();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const toggleSystemPromptMode = () => {
    setSystemPromptMode(prev => prev === 'friendly' ? 'challenging' : 'friendly');
  };

  const toggleVoiceMode = () => {
    setVoiceMode(prev => !prev);
    // If turning off voice mode while realtime is active, stop it
    if (voiceMode && isRealtimeActive) {
      stopRealtimeConnection();
    }
  };

  const toggleConversations = () => {
    setShowConversations(prev => !prev);
  };

  // Start Realtime API connection for voice interaction
  const startRealtimeConnection = () => {
    if (isRealtimeActive) return;
    
    try {
      // In a real implementation, we would establish a WebSocket or WebRTC connection
      // to the OpenAI Realtime API here
      console.log('Starting Realtime API connection...');
      
      // Mock WebSocket connection for demonstration
      const mockWebSocket = {
        send: (data: string) => {
          console.log('Sending data to Realtime API:', data);
        },
        close: () => {
          console.log('Closing Realtime API connection');
        }
      } as unknown as WebSocket;
      
      realtimeConnectionRef.current = mockWebSocket;
      setIsRealtimeActive(true);
      
      // Add a system message to indicate voice mode is active
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: 'Voice mode activated. I\'m listening to you in real-time now.' 
        }
      ]);
    } catch (error) {
      console.error('Error starting Realtime API connection:', error);
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: 'Sorry, there was an error connecting to the Realtime API. Please try again.' 
        }
      ]);
    }
  };

  // Stop Realtime API connection
  const stopRealtimeConnection = () => {
    if (!isRealtimeActive) return;
    
    try {
      if (realtimeConnectionRef.current) {
        realtimeConnectionRef.current.close();
        realtimeConnectionRef.current = null;
      }
      
      setIsRealtimeActive(false);
      
      // Add a system message to indicate voice mode is deactivated
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: 'Voice mode deactivated. You can now type your messages.' 
        }
      ]);
    } catch (error) {
      console.error('Error stopping Realtime API connection:', error);
    }
  };

  const toggleRealtimeConnection = () => {
    if (isRealtimeActive) {
      stopRealtimeConnection();
    } else {
      startRealtimeConnection();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="bg-white p-4 shadow-sm flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleVoiceMode}
            className={`px-4 py-2 rounded-md ${
              voiceMode ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            aria-label={voiceMode ? 'Switch to text mode' : 'Switch to voice mode'}
          >
            {voiceMode ? 'Voice Mode' : 'Text Mode'}
          </button>
          <button
            onClick={toggleSystemPromptMode}
            className={`px-4 py-2 rounded-md ${
              systemPromptMode === 'challenging' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            aria-label={systemPromptMode === 'challenging' ? 'Switch to friendly mode' : 'Switch to challenging mode'}
          >
            {systemPromptMode === 'challenging' ? 'Challenge Mode' : 'Friendly Mode'}
          </button>
        </div>
        <button
          onClick={toggleConversations}
          className="px-4 py-2 rounded-md bg-gray-200 text-gray-700"
          aria-label={showConversations ? 'Hide conversations' : 'Show conversations'}
        >
          {showConversations ? 'Hide History' : 'Show History'}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Conversations sidebar */}
        {showConversations && (
          <div className="w-64 bg-gray-50 border-r overflow-y-auto p-4">
            <div className="mb-4">
              <button
                onClick={startNewConversation}
                className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                New Conversation
              </button>
            </div>
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-2 rounded-md cursor-pointer ${
                    currentConversationId === conversation.id
                      ? 'bg-blue-100'
                      : 'hover:bg-gray-200'
                  }`}
                  onClick={() => selectConversation(conversation.id)}
                >
                  <div className="font-medium truncate">
                    {conversation.title || 'Conversation ' + conversation.id.substring(0, 8)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(conversation.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={message.id || index}
                className={`p-3 rounded-lg max-w-3/4 ${
                  message.role === 'user'
                    ? 'bg-blue-100 ml-auto'
                    : 'bg-white mr-auto'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.llmUsed && (
                  <p className="text-xs text-gray-500 mt-1">
                    Model: {message.llmUsed}
                  </p>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="bg-white p-3 rounded-lg mr-auto">
                <p>Thinking...</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="bg-white p-4 border-t">
            {voiceMode ? (
              <div className="flex justify-center items-center p-4">
                <button
                  onClick={toggleRealtimeConnection}
                  className={`p-4 rounded-full ${
                    isRealtimeActive ? 'bg-red-500' : 'bg-blue-500'
                  } text-white`}
                  disabled={isLoading}
                >
                  {isRealtimeActive ? (
                    <span className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Stop Listening
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                        />
                      </svg>
                      Start Listening
                    </span>
                  )}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Type your message..."
                  className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                  ref={inputRef}
                />
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:bg-blue-300"
                  disabled={isLoading || !input.trim()}
                >
                  Send
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Hidden audio element for TTS playback */}
      <audio ref={audioRef} src={audioUrl || ''} className="hidden" />
    </div>
  );
}
