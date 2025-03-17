'use client';

import React from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatSettings } from './ChatSettings';
import { useChatContext } from '@/context/ChatContext';
import { Loader2 } from 'lucide-react';

export const ChatInterface: React.FC = () => {
  const {
    messages,
    isLoading,
    systemPromptMode,
    sendMessage,
    rateMessage,
    setSystemPromptMode,
    error,
  } = useChatContext();

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col md:flex-row gap-4 h-full">
      <div className="flex-1 flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 mb-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center text-muted-foreground">
              <div>
                <h3 className="text-lg font-semibold mb-2">Welcome to AI Companion</h3>
                <p>Start a conversation by typing a message below.</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessage
                key={message.id}
                id={message.id}
                role={message.role}
                content={message.content}
                llmUsed={message.llmUsed}
                timestamp={message.timestamp}
                rating={message.rating}
                onRate={message.role === 'assistant' ? rateMessage : undefined}
              />
            ))
          )}
          {isLoading && (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">Thinking...</span>
            </div>
          )}
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t">
          <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
        </div>
      </div>
      <div className="md:w-80 p-4">
        <ChatSettings
          systemPromptMode={systemPromptMode}
          setSystemPromptMode={setSystemPromptMode}
        />
      </div>
    </div>
  );
};
