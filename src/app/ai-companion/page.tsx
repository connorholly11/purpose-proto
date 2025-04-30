'use client';

import React, { useState } from 'react';
import { Text, Card, TextInput, Button, Surface, IconButton, Column, Row } from '../../components';
import { useAdminMode } from '../../components/AppHeader';
import styles from './page.module.css';

export default function AICompanionPage() {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Array<{id: string, role: string, content: string, timestamp: string}>>([
    {id: '1', role: 'assistant', content: 'Hello! I\'m your AI companion. How can I help you today?', timestamp: new Date().toISOString()}
  ]);
  const [loading, setLoading] = useState(false);
  
  const { isAdminMode } = useAdminMode();

  const handleSend = () => {
    if (inputText.trim() && !loading) {
      // Add user message
      const userMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: inputText,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInputText('');
      
      // Simulate AI response
      setLoading(true);
      
      setTimeout(() => {
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `This is a simulated response to "${inputText}". In a real implementation, this would call the API and get a proper AI response.`,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, aiMessage]);
        setLoading(false);
      }, 1500);
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
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
        </Card>
      )}
    </div>
  );
}