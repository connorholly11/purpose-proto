'use client';

import React, { useState, useEffect } from 'react';
import { Text, Card, TextInput, Surface, IconButton } from '../../components';
import { useAdminMode } from '../../components/AppHeader';
import { useChatContext } from '../../context/ChatContext';
import styles from './page.module.css';

export default function AICompanionPage() {
  const [inputText, setInputText] = useState('');
  const { isAdminMode } = useAdminMode();
  
  // Use the ChatContext instead of local state
  const {
    messages,
    loading,
    error,
    sendMessage,
  } = useChatContext();

  // Load initial greeting if no messages exist
  useEffect(() => {
    if (messages.length === 0) {
      // Check if there are no messages and add a welcome message
      const welcomeMessage = {
        id: 'welcome-1',
        content: 'Hello! I\'m your AI companion. How can I help you today?',
        role: 'assistant',
        createdAt: new Date().toISOString()
      };
      
      // This is a hack to add the first message - in a real implementation, 
      // we might want to refactor the ChatContext to handle this case
      sendMessage('', undefined, false, false)
        .catch(err => console.error('Error initializing chat:', err));
    }
  }, [messages, sendMessage]);

  const handleSend = () => {
    if (inputText.trim() && !loading) {
      // Use the ChatContext's sendMessage function
      sendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.messagesContainer}>
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`${styles.messageBubble} ${message.role === 'user' ? styles.userMessage : styles.assistantMessage}`}
          >
            <Surface 
              className={`${styles.messageContent} ${message.role === 'user' ? styles.userContent : styles.assistantContent}`}
              elevation={1}
            >
              <Text>{message.content}</Text>
            </Surface>
            <Text className={styles.timestamp}>
              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </div>
        ))}
        
        {loading && (
          <div className={`${styles.messageBubble} ${styles.assistantMessage}`}>
            <Surface className={`${styles.messageContent} ${styles.assistantContent}`} elevation={1}>
              <div className={styles.loadingIndicator}>
                <div className={styles.loadingDot}></div>
                <div className={styles.loadingDot}></div>
                <div className={styles.loadingDot}></div>
              </div>
            </Surface>
          </div>
        )}

        {error && (
          <div className={styles.errorContainer}>
            <Text color="error">Error: {error}</Text>
          </div>
        )}
      </div>
      
      <div className={styles.inputContainer}>
        <TextInput
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          multiline
          className={styles.input}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <IconButton
          icon="arrow-up"
          color="#007AFF"
          size={24}
          onClick={handleSend}
          disabled={!inputText.trim() || loading}
          className={styles.sendButton}
        />
      </div>
      
      {isAdminMode && (
        <Card className={styles.adminPanel} title="Admin Controls">
          <Text>Additional controls would appear here for admins.</Text>
          {error && <Text color="error">Last Error: {error}</Text>}
        </Card>
      )}
    </div>
  );
}