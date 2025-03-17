'use client';

import { useState, useRef, useEffect } from 'react';
import { sendChatMessage, textToSpeech, speechToText, ChatRequest, ChatResponse } from '@/services/api';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  llmUsed?: string;
}

interface ChatInterfaceProps {
  initialSystemPromptMode?: 'friendly' | 'challenging';
}

export default function ChatInterface({
  initialSystemPromptMode = 'friendly',
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemPromptMode, setSystemPromptMode] = useState<'friendly' | 'challenging'>(initialSystemPromptMode);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
        userId: 'user-' + Date.now(), // Simple user ID for demo
      };
      
      const response = await sendChatMessage(chatRequest);
      
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

  const handleRecordToggle = async () => {
    if (!isRecording) {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
        
        // Show notification
        setMessages(prev => [
          ...prev, 
          { 
            role: 'assistant', 
            content: 'Voice recording started. Click the button again to stop and send your message.',
            llmUsed: 'system'
          }
        ]);
      } catch (error) {
        console.error('Error starting recording:', error);
        setMessages(prev => [
          ...prev, 
          { 
            role: 'assistant', 
            content: 'Error accessing microphone. Please check your browser permissions.',
            llmUsed: 'system'
          }
        ]);
      }
    } else {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        
        // Show processing message
        setMessages(prev => [
          ...prev, 
          { 
            role: 'user', 
            content: '[Voice message - processing...]'
          }
        ]);
        
        // Process the recorded audio after a short delay to ensure all data is collected
        setTimeout(async () => {
          try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
            
            // Send to STT API
            const transcript = await speechToText(audioFile);
            
            // Update the message with the transcript
            setMessages(prev => {
              const newMessages = [...prev];
              // Replace the last message
              if (newMessages.length > 0) {
                newMessages[newMessages.length - 1] = {
                  role: 'user',
                  content: transcript
                };
              }
              return newMessages;
            });
            
            // Now send the transcript to the chat API
            if (transcript.trim()) {
              setIsLoading(true);
              
              try {
                // Send message to API
                const chatRequest: ChatRequest = {
                  message: transcript,
                  systemPromptMode,
                  userId: 'user-' + Date.now(), // Simple user ID for demo
                };
                
                const response = await sendChatMessage(chatRequest);
                
                // Add assistant message to chat
                const assistantMessage: Message = {
                  id: response.id,
                  role: 'assistant',
                  content: response.response,
                  llmUsed: response.llmUsed,
                };
                
                setMessages((prev) => [...prev, assistantMessage]);
                
                // Convert response to speech
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
              }
            }
          } catch (error) {
            console.error('Error processing audio:', error);
            setMessages(prev => {
              const newMessages = [...prev];
              // Replace the last message
              if (newMessages.length > 0) {
                newMessages[newMessages.length - 1] = {
                  role: 'user',
                  content: 'Error processing voice message. Please try again or type your message.'
                };
              }
              return newMessages;
            });
          }
        }, 500);
      }
    }
  };

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      setMessages([]);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 bg-white rounded-lg shadow-sm">
      {/* System prompt selection */}
      <div className="flex flex-col sm:flex-row justify-between mb-4 p-3 bg-gray-50 rounded-lg border">
        <div className="mb-2 sm:mb-0">
          <label className="mr-2 font-medium text-gray-700">Mode:</label>
          <select
            value={systemPromptMode}
            onChange={(e) => setSystemPromptMode(e.target.value as 'friendly' | 'challenging')}
            className="p-2 border rounded bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            title={systemPromptMode === 'friendly' ? 'AI will be supportive and helpful' : 'AI will challenge your assumptions'}
          >
            <option value="friendly">Friendly</option>
            <option value="challenging">Challenging</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium text-gray-700 mr-2">Model:</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">GPT-4o</span>
          </div>
          <button 
            onClick={clearChat}
            className="ml-4 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
            title="Clear chat history"
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 border rounded-lg bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 my-8 p-6 bg-white rounded-lg border border-dashed">
            <h3 className="text-lg font-medium mb-2">Welcome to AI Companion</h3>
            <p>Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-blue-100 ml-12 border-blue-200 border' 
                  : message.llmUsed === 'system'
                    ? 'bg-yellow-50 border border-yellow-200 text-sm italic'
                    : 'bg-white mr-12 shadow-sm border'
              }`}
            >
              <div className="font-semibold mb-1 flex items-center">
                {message.role === 'user' ? 'You' : 'AI'}
                {message.llmUsed && message.llmUsed !== 'system' && (
                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded ml-2">
                    {message.llmUsed}
                  </span>
                )}
              </div>
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="bg-white mr-12 p-4 rounded-lg shadow-sm border animate-pulse">
            <div className="font-semibold mb-1">AI</div>
            <div className="flex space-x-2">
              <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
              <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <button
          type="button"
          onClick={handleRecordToggle}
          className={`p-3 rounded-full flex items-center justify-center ${
            isRecording 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
          title={isRecording ? 'Stop recording' : 'Start voice recording'}
          disabled={isLoading}
        >
          {isRecording ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <rect width="10" height="10" x="3" y="3" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 11a3 3 0 0 0 3-3V4a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3z"/>
              <path d="M13 8c0 2.76-2.24 5-5 5s-5-2.24-5-5H1c0 3.53 2.61 6.43 6 6.92V17h2v-2.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          )}
        </button>
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
          {isPlayingAudio && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="flex space-x-1">
                <div className="w-1 h-4 bg-blue-500 animate-pulse"></div>
                <div className="w-1 h-6 bg-blue-500 animate-pulse delay-75"></div>
                <div className="w-1 h-3 bg-blue-500 animate-pulse delay-150"></div>
              </div>
            </div>
          )}
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white p-3 rounded-lg disabled:bg-blue-300 hover:bg-blue-600 transition-colors"
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z"/>
            </svg>
          )}
        </button>
      </form>

      {/* Hidden audio player for TTS */}
      <audio 
        ref={audioRef} 
        src={audioUrl || ''} 
        className="hidden" 
        onEnded={() => setIsPlayingAudio(false)}
        onError={() => setIsPlayingAudio(false)}
      />
    </div>
  );
} 