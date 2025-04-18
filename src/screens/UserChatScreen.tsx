import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Text, TextInput, TouchableOpacity, Platform, KeyboardAvoidingView } from 'react-native';
import { Avatar, useTheme as usePaperTheme } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useChatContext, Message } from '../context/ChatContext';
import { useSystemPrompts } from '../context/SystemPromptContext';
import { useNavigation } from '@react-navigation/native';

// For local-only chats, define a simple message type
type ChatMessage = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

// UserChatScreen component - used for both iOS and web "/user" path
const UserChatScreen = () => {
  // Navigation
  const navigation = useNavigation();
  
  // Use the real chat context for API-powered conversations
  const { 
    messages: contextMessages, 
    loading, 
    error, 
    sendMessage: contextSendMessage, 
    startNewConversation,
    conversationId,
    currentModel
  } = useChatContext();
  
  // Get system prompts from context
  const { activePrompt } = useSystemPrompts();
  
  // Get theme from context
  const { colorTheme } = useTheme();
  const paperTheme = usePaperTheme();
  
  // For local-only fallback mode
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: "Hi there! I'm Ada, your AI companion. How can I help you today? 😊",
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  
  const [hasConversation, setHasConversation] = useState(
    contextMessages.length > 0 || localMessages.length > 1
  );
  const [inputText, setInputText] = useState('');
  const [useUserContext, setUseUserContext] = useState(true);
  
  const inputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Sample suggestion chips for new conversations
  const suggestionChips = [
    "What can you help me with?",
    "Tell me a fun fact",
    "What's the weather like today?",
    "Write a short poem"
  ];

  // Primary function to send messages - tries to use backend first, falls back to local simulation
  const handleSendMessage = async (text?: string) => {
    // Get text from input if not provided
    if (!text) {
      text = inputText;
      if (!text.trim()) return;
      setInputText(''); // Clear input immediately
    }
    
    try {
      // Try to use the real backend
      await contextSendMessage(
        text,
        undefined,
        false,
        useUserContext
      );
      setHasConversation(true);
    } catch (err) {
      console.error('Error with backend chat, falling back to local mode:', err);
      
      // Fallback to local mode if backend fails
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        text,
        sender: 'user',
        timestamp: new Date(),
      };
      setLocalMessages(prev => [...prev, userMessage]);
      setHasConversation(true);
      
      // Simulate AI response
      setTimeout(() => {
        let responseText = "I'm here to help with anything you'd like to know or discuss. How can I assist you today?";
        
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: responseText,
          sender: 'ai',
          timestamp: new Date(),
        };
        setLocalMessages(prev => [...prev, aiMessage]);
      }, 1000);
    }
  };

  // Handler for clicking a suggestion chip
  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion);
    handleSendMessage(suggestion);
  };
  
  // Start a new chat
  const handleNewConversation = () => {
    startNewConversation();
  };

  // Navigate to settings
  const navigateToSettings = () => {
    navigation.navigate('Settings' as never);
  };

  // Choose which messages to display - prefer backend messages, fall back to local
  const displayMessages = contextMessages.length > 0 ? 
    contextMessages : 
    localMessages;
    
  // Type guard function to check message type
  const isBackendMessage = (message: Message | ChatMessage): message is Message => {
    return 'role' in message;
  };
  
  const isLocalMessage = (message: Message | ChatMessage): message is ChatMessage => {
    return 'sender' in message;
  };
  
  // Update hasConversation when messages change
  useEffect(() => {
    setHasConversation(contextMessages.length > 0 || localMessages.length > 1);
  }, [contextMessages, localMessages]);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [displayMessages]);

  const isWeb = Platform.OS === 'web';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={64}
    >
      {/* Header - shown on all platforms */}
      <View style={styles.header}>
        {/* On mobile, show settings icon */}
        <TouchableOpacity onPress={navigateToSettings}>
          <MaterialIcons name="person-outline" size={24} color={paperTheme.colors.primary} />
        </TouchableOpacity>
        <View style={{flex: 1}}/>
        <TouchableOpacity onPress={handleNewConversation}>
          <MaterialIcons name="add" size={24} color={paperTheme.colors.primary} />
        </TouchableOpacity>
      </View>
      
      {/* AI Assistant Chat Interface */}
      <View style={styles.chatContainer}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {displayMessages.map((message) => (
            <View 
              key={message.id}
              style={[
                styles.messageRow,
                (isBackendMessage(message) && message.role === 'user') || 
              (isLocalMessage(message) && message.sender === 'user') ? styles.userMessageRow : {}
              ]}
            >
              {(isBackendMessage(message) && message.role === 'assistant') || 
                (isLocalMessage(message) && message.sender === 'ai') && (
                <Avatar.Text 
                  size={40} 
                  label="A" 
                  style={[styles.avatar, { backgroundColor: paperTheme.colors.primary }]}
                  color="white"
                />
              )}
              <View 
                style={[
                  styles.messageBubble,
                  (isBackendMessage(message) && message.role === 'user') || 
                  (isLocalMessage(message) && message.sender === 'user')
                    ? [styles.userMessageBubble, { backgroundColor: paperTheme.colors.primary }] 
                    : styles.aiMessageBubble
                ]}
              >
                <Text style={(isBackendMessage(message) && message.role === 'user') || 
                  (isLocalMessage(message) && message.sender === 'user') ? styles.userMessageText : styles.aiMessageText}>
                  {isBackendMessage(message) ? message.content : isLocalMessage(message) ? message.text : ""}
                </Text>
              </View>
            </View>
          ))}
          
          {/* Show typing indicator when loading */}
          {loading && (
            <View style={styles.messageRow}>
              <Avatar.Text 
                size={40} 
                label="A" 
                style={[styles.avatar, { backgroundColor: paperTheme.colors.primary }]}
                color="white"
              />
              <View style={[styles.messageBubble, styles.aiMessageBubble, styles.loadingBubble]}>
                <View style={styles.loadingDots}>
                  <View style={styles.loadingDot} />
                  <View style={styles.loadingDot} />
                  <View style={styles.loadingDot} />
                </View>
              </View>
            </View>
          )}
          
          {/* Show suggestion chips if no conversation */}
          {!hasConversation && (
            <View style={styles.suggestionsContainer}>
              {suggestionChips.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.suggestionChip, { borderColor: paperTheme.colors.primary + '40' }]}
                  onPress={() => handleSuggestionClick(suggestion)}
                >
                  <Text style={[styles.suggestionText, { color: paperTheme.colors.primary }]}>
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
        
        {/* Error message display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        {/* Message Input with camera and mic icons */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.mediaButton} onPress={() => console.log('Camera tapped')}>
            <MaterialIcons name="camera-alt" size={24} color="#999" />
          </TouchableOpacity>
          
          <TextInput 
            ref={inputRef}
            style={styles.input}
            placeholder="iMessage"
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSendMessage()}
          />
          
          {!inputText.trim() ? (
            <TouchableOpacity style={styles.mediaButton} onPress={() => console.log('Microphone tapped')}>
              <MaterialIcons name="mic" size={24} color="#999" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.sendButton, { backgroundColor: paperTheme.colors.primary }]}
              onPress={() => handleSendMessage()}
              disabled={loading}
            >
              <MaterialIcons name="send" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20, // Adjusted for iOS status bar
    paddingBottom: 10,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messagesContent: {
    paddingBottom: 24,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  avatar: {
    marginRight: 12,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 20, // More rounded for iOS
  },
  aiMessageBubble: {
    backgroundColor: '#e9e9eb', // iOS light gray
    borderTopLeftRadius: 4,
  },
  userMessageBubble: {
    borderTopRightRadius: 4,
  },
  aiMessageText: {
    color: '#000',
    fontSize: 16,
  },
  userMessageText: {
    color: 'white',
    fontSize: 16,
  },
  loadingBubble: {
    minWidth: 70,
    minHeight: 36,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  loadingDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 20,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
    marginHorizontal: 3,
    opacity: 0.7,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 16,
  },
  suggestionChip: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
  },
  suggestionText: {
    fontSize: 14,
  },
  errorContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    backgroundColor: '#FFCCCC',
    borderRadius: 8,
  },
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  mediaButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 8,
    fontSize: 16,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default UserChatScreen;