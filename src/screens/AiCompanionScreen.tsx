import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Text, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Avatar, useTheme as usePaperTheme, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useChatContext, Message } from '../context/ChatContext';
import { useSystemPrompts } from '../context/SystemPromptContext';
import { useAdminMode } from '../components/AppHeader';

// For local-only chats, define a simple message type
type ChatMessage = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

// AiCompanionScreen component
const AiCompanionScreen = () => {
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
  const { activePrompt, loadingPrompts } = useSystemPrompts();
  
  // Get admin mode context
  const { isAdminMode, setIsAdminMode } = useAdminMode();
  
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
  
  // Always focused in full-page mode
  const chatFocused = true;
  const [hasConversation, setHasConversation] = useState(
    contextMessages.length > 0 || localMessages.length > 1
  );
  const [inputText, setInputText] = useState('');
  const [useUserContext, setUseUserContext] = useState(true);
  const [activeChatCategory, setActiveChatCategory] = useState('all');
  
  const inputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Helper to toggle admin mode
  const toggleAdminMode = () => {
    console.log(`[AiCompanionScreen] Toggling admin mode from ${isAdminMode} to ${!isAdminMode}`);
    if (setIsAdminMode) {
      setIsAdminMode(!isAdminMode);
    } else {
      console.warn("[AiCompanionScreen] setIsAdminMode is not available (likely on iOS)");
    }
  };

  // Sample suggestion chips for new conversations
  const suggestionChips = [
    "What quests do I have pending?",
    "How can I earn more XP?",
    "Tell me about my progress",
    "What's my daily streak?"
  ];
  
  // Chat categories
  const chatCategories = [
    { id: "all", name: "All" },
    { id: "health", name: "Health" },
    { id: "relationships", name: "Relationships" },
    { id: "productivity", name: "Productivity" },
    { id: "goals", name: "Goals" }
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
        let responseText = '';
        
        if (text?.toLowerCase().includes('quest')) {
          responseText = "You have 3 quests pending! Would you like to see them? 📋✨";
        } else if (text?.toLowerCase().includes('xp') || text?.toLowerCase().includes('experience')) {
          responseText = "You've earned 560 XP so far. You need 190 more XP to reach Level 9! Keep completing quests to earn more. 🚀";
        } else if (text?.toLowerCase().includes('progress')) {
          responseText = "You're making great progress! You've completed 60% of your weekly goals and you're on a 12-day streak. Keep it up! 📈";
        } else if (text?.toLowerCase().includes('streak')) {
          responseText = "Your current streak is 12 days! That's impressive dedication. 🔥 You'll get a special badge at 30 days!";
        } else {
          responseText = "I'm here to help you achieve your goals and track your progress. Is there something specific you'd like to know about your quests or progress? 😊";
        }
        
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
    // Remove delay since we don't need to wait for UI changes
    handleSendMessage(suggestion);
  };
  
  // Start a new chat
  const startNewChat = () => {
    startNewConversation();
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: paperTheme.colors.primary }]}>Ada</Text>
        <View style={[styles.levelBadge, { backgroundColor: paperTheme.colors.primary }]}>
          <Text style={styles.levelText}>Level 8</Text>
        </View>
      </View>
      
      {/* AI Assistant Chat Interface */}
      <View style={styles.chatContainer}>
        <View style={styles.chatHeader}>
          <Text style={[styles.chatTitle, { color: paperTheme.colors.primary }]}>
            {!loadingPrompts && activePrompt ? `${activePrompt.name}` : 'AI Assistant'}
            {currentModel && <Text style={styles.modelIndicator}> - {currentModel}</Text>}
          </Text>
        </View>
        
        {/* Admin mode header - only shown in admin mode */}
        {isAdminMode && (
          <View style={styles.adminHeader}>
            <View style={styles.adminHeaderContent}>
              <Text style={styles.adminHeaderText}>
                {conversationId && <Text style={styles.conversationIndicator}>(Conversation in progress)</Text>}
              </Text>
              
              <View style={styles.adminControls}>
                <View style={styles.contextToggleContainer}>
                  <Text style={styles.contextToggleLabel}>User Context:</Text>
                  <TouchableOpacity 
                    style={[
                      styles.toggleSwitch, 
                      useUserContext ? { backgroundColor: paperTheme.colors.primary } : {}
                    ]}
                    onPress={() => setUseUserContext(!useUserContext)}
                  >
                    <View style={[
                      styles.toggleHandle, 
                      useUserContext ? styles.toggleHandleActive : {}
                    ]} />
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity 
                  style={styles.newChatButton}
                  onPress={startNewConversation}
                >
                  <Text style={styles.newChatText}>New Chat</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        
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
        
        {/* Message Input */}
        <View style={styles.inputContainer}>
          <TextInput 
            ref={inputRef}
            style={styles.input}
            placeholder="Message Ada..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSendMessage()}
          />
          <TouchableOpacity 
            style={[styles.sendButton, { backgroundColor: paperTheme.colors.primary }]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim() || loading}
          >
            <MaterialIcons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      
    </View>
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
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  levelText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  adminToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  toggleLabel: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 8,
  },
  toggleSwitch: {
    width: 40,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    padding: 2,
  },
  toggleHandle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
  },
  toggleHandleActive: {
    transform: [{ translateX: 16 }],
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#f0f9ff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modelIndicator: {
    fontSize: 12,
    color: '#0066CC',
    fontWeight: '500',
  },
  conversationIndicator: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminHeader: {
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
  },
  adminHeaderContent: {
    paddingHorizontal: 16,
  },
  adminHeaderText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  adminControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  contextToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contextToggleLabel: {
    fontSize: 13,
    marginRight: 8,
  },
  newChatButton: {
    padding: 8,
    paddingHorizontal: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
  },
  newChatText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messagesContent: {
    paddingBottom: 16,
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
    borderRadius: 16,
  },
  aiMessageBubble: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderTopLeftRadius: 0,
  },
  userMessageBubble: {
    borderTopRightRadius: 0,
  },
  aiMessageText: {
    color: '#333',
    fontSize: 14,
  },
  userMessageText: {
    color: 'white',
    fontSize: 14,
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
    fontSize: 12,
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
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  categoriesContainer: {
    paddingBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  chatItemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatItemAvatarText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  chatItemContent: {
    flex: 1,
    marginRight: 8,
  },
  chatItemPreview: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  chatItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatItemDate: {
    fontSize: 12,
    color: '#999',
    marginRight: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryBadgeText: {
    fontSize: 10,
  },
  emptyContainer: {
    backgroundColor: '#f9f9f9',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  emptyText: {
    color: '#999',
    marginBottom: 8,
  },
  newChatButtonMain: {
    marginTop: 16,
    borderRadius: 12,
  },
});

export default AiCompanionScreen;