import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Switch, TouchableOpacity, Animated, ScrollView, Text, TextInput, ActivityIndicator } from 'react-native';
import { Avatar, Surface, IconButton, FAB, useTheme, MD3Theme } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChatContext, Message } from '../../context/ChatContext';
import { useSystemPrompts } from '../../context/SystemPromptContext';
import { useAuthContext } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { createPlatformStyleSheet, spacing, createShadow, keyboardBehavior, keyboardVerticalOffset, platformSelect } from '../../theme';
// import useSpeechRecognition from '../../hooks/useSpeechRecognition';

// Theme colors that will pull from the global theme
const getThemeColors = (theme: MD3Theme) => ({
  background: theme.colors.background,
  userBubble: theme.colors.primary,
  assistantBubble: theme.colors.surfaceVariant,
  userText: '#FFFFFF',
  assistantText: theme.colors.onSurface,
  inputBackground: theme.colors.surfaceVariant,
  sendButton: theme.colors.primary,
  header: theme.colors.surface,
  headerText: theme.colors.onSurfaceVariant,
  typingDots: theme.colors.onSurfaceVariant,
  switchTrackActive: theme.colors.primary,
  switchTrackInactive: '#E5E5EA',
  shadow: 'rgba(0, 0, 0, 0.1)',
  userBubbleShadow: 'rgba(0, 87, 178, 0.25)',
  assistantBubbleShadow: 'rgba(0, 0, 0, 0.1)',
  inputShadow: 'rgba(0, 0, 0, 0.1)',
  messageTimestamp: theme.colors.onSurfaceVariant,
  scrollButtonBackground: `${theme.colors.primary}E6`,
});

// Component to render typing indicator
const TypingIndicator = () => {
  const theme = useTheme();
  const COLORS = getThemeColors(theme);
  
  // Create animated values for the dots
  const dot1Opacity = useRef(new Animated.Value(0.4)).current;
  const dot2Opacity = useRef(new Animated.Value(0.4)).current;
  const dot3Opacity = useRef(new Animated.Value(0.4)).current;
  
  const [scaleAnim] = useState(new Animated.Value(0.95));
  const [fadeAnim] = useState(new Animated.Value(0));
  
  // Animation sequence
  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
    
    const createAnimation = (value: Animated.Value, delay: number) => {
      return Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration: 400,
          delay,
          useNativeDriver: true
        }),
        Animated.timing(value, {
          toValue: 0.4,
          duration: 400,
          useNativeDriver: true
        })
      ]);
    };
    
    // Run the animations in a loop
    const runAnimation = () => {
      Animated.parallel([
        createAnimation(dot1Opacity, 0),
        createAnimation(dot2Opacity, 200),
        createAnimation(dot3Opacity, 400)
      ]).start(() => runAnimation());
    };
    
    runAnimation();
    
    // Clean up animations on unmount
    return () => {
      dot1Opacity.stopAnimation();
      dot2Opacity.stopAnimation();
      dot3Opacity.stopAnimation();
    };
  }, []);
  
  return (
    <Animated.View style={{
      opacity: fadeAnim,
      transform: [{ scale: scaleAnim }],
      alignSelf: 'flex-start',
      marginBottom: 16,
    }}>
      <View style={[styles.messageBubble, styles.aiBubble, styles.typingContainer]}>
        <View style={styles.typingDotsContainer}>
          <Animated.View style={[styles.typingDot, { opacity: dot1Opacity, backgroundColor: COLORS.typingDots }]} />
          <Animated.View style={[styles.typingDot, { opacity: dot2Opacity, backgroundColor: COLORS.typingDots }]} />
          <Animated.View style={[styles.typingDot, { opacity: dot3Opacity, backgroundColor: COLORS.typingDots }]} />
        </View>
      </View>
      <View 
        style={[
          styles.tailStyle,
          styles.aiTail,
          { backgroundColor: COLORS.assistantBubble }
        ]} 
      />
    </Animated.View>
  );
};

// Component to render a chat message
const MessageBubble = ({ message }: { message: Message }) => {
  const theme = useTheme();
  const COLORS = getThemeColors(theme);

  // For system messages (rare), render a system bubble
  if (message.role === 'assistant' && message.content.startsWith('[System]')) {
    return (
      <View style={styles.systemMessage}>
        <Text style={{ color: '#FFFFFF' }}>{message.content.replace('[System]', '').trim()}</Text>
      </View>
    );
  }

  // Render a regular text bubble based on sender
  const isUserMessage = message.role === 'user';
  
  return (
    <View style={[
      styles.messageBubble,
      isUserMessage
        ? [styles.userBubble, { backgroundColor: COLORS.userBubble }]
        : [styles.aiBubble, { backgroundColor: COLORS.assistantBubble }]
    ]}>
      <Text style={[
        styles.messageText,
        { color: isUserMessage ? COLORS.userText : COLORS.assistantText }
      ]}>
        {message.content}
      </Text>
    </View>
  );
};

// Local message type for fallback (matches IOSChatScreen and UserChatScreen)
type ChatMessage = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

// Type guard functions for message type checking
const isBackendMessage = (message: Message | ChatMessage): message is Message => {
  return 'role' in message;
};

const isLocalMessage = (message: Message | ChatMessage): message is ChatMessage => {
  return 'sender' in message;
};

// Main ChatView component
type ChatViewProps = {
  adminControls?: boolean;
  onNewChat?: () => void;
  showCost?: boolean;
  useUserContext: boolean;
  onToggleContext?: (value: boolean) => void;
};

export const ChatView = ({ 
  adminControls = false,
  onNewChat,
  showCost = false,
  useUserContext = true,
  onToggleContext
}: ChatViewProps) => {
  const theme = useTheme();
  const COLORS = getThemeColors(theme);
  const navigation = useNavigation();
  
  // Get state and functions from ChatContext
  const { messages: contextMessages, loading, error, sendMessage, startNewConversation, conversationId, currentModel, conversationCost } = useChatContext();
  
  // Get system prompts from context
  const { activePrompt, loadingPrompts } = useSystemPrompts();

  // Get auth context for logout
  const { signOut } = useAuthContext();

  // For local-only fallback mode
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: "Hi there! I'm your AI assistant. How can I help you today?",
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);

  // Local state
  const [inputText, setInputText] = useState('');
  const [hasConversation, setHasConversation] = useState(
    contextMessages.length > 0 || localMessages.length > 1
  );
  
  const isWeb = Platform.OS === 'web';
  const isIOS = Platform.OS === 'ios';
  const insets = useSafeAreaInsets();
  
  // Choose which messages to display - prefer backend messages, fall back to local
  const displayMessages = contextMessages.length > 0 ? 
    contextMessages : 
    localMessages;

  // Determine if we're using FlatList (web/bigger screens) or ScrollView (mobile)
  const usesFlatList = isWeb || !isIOS;
  const flatListRef = useRef<FlatList>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Add state for scroll visibility
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  // Speech-to-text integration
  // const { transcript, isRecording, startRecording, stopRecording } = useSpeechRecognition();
  const isRecording = false;
  
  // Sample suggestion chips for new conversations
  const suggestionChips = [
    "What can you help me with?",
    "Tell me a fun fact",
    "What's the weather like today?",
    "Write a short poem"
  ];

  // Function to handle sending a message using the context
  const handleSend = async () => {
    if (inputText.trim() && !loading) {
      console.log('[ChatView] Send button pressed');
      console.log(`[ChatView] Message to send: "${inputText.substring(0, 30)}${inputText.length > 30 ? '...' : ''}"`);
      console.log(`[ChatView] User context enabled: ${useUserContext}`);
      console.log(`[ChatView] Current conversation ID: ${conversationId || 'New conversation'}`);
      
      const messageText = inputText;
      setInputText(''); // Clear input immediately

      try {
        console.log('[ChatView] Calling ChatContext.sendMessage()');
        // Call the context's sendMessage function with just the message and user context
        await sendMessage(
          messageText,
          undefined,
          false,
          useUserContext
        );
        setHasConversation(true);
        console.log('[ChatView] Message sent and response received successfully');
      } catch (err) {
        // Error is handled within the context, but you could add extra UI feedback if needed
        console.error('[ChatView] Error sending message:', err);
        
        // Fallback to local mode if backend fails
        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          text: messageText,
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
    } else {
      console.log(`[ChatView] Send attempted but conditions not met:
      - Has text: ${Boolean(inputText.trim())}
      - Not loading: ${!loading}`);
    }
  };
  
  // Handler for clicking a suggestion chip
  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion);
    handleSend();
  };
  
  // Effect to update input text when transcript changes
  // useEffect(() => {
  //   if (transcript && isRecording === false) {
  //     setInputText(transcript);
  //   }
  // }, [transcript, isRecording]);
  
  // Handle key press for the text input
  const handleKeyPress = (e: any) => {
    // Check if Enter was pressed without the Shift key
    if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault(); // Prevent default behavior (new line)
      handleSend();
    }
  };
  
  // Navigate to settings
  const navigateToSettings = () => {
    navigation.navigate('Settings' as never);
  };
  
  // Only scroll to the bottom when new messages arrive, don't force re-renders during typing
  const previousMessageCount = useRef(0);
  
  useEffect(() => {
    // Only log and take action if the message count actually changed
    if (displayMessages.length !== previousMessageCount.current) {
      console.log(`[ChatView] Message count changed to: ${displayMessages.length}`);
      
      // For FlatList
      if (usesFlatList && flatListRef.current) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
      
      // For ScrollView
      if (!usesFlatList && scrollViewRef.current) {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
      
      // Update the previous count
      previousMessageCount.current = displayMessages.length;
    }
  }, [displayMessages]);

  // Update hasConversation when messages change
  useEffect(() => {
    setHasConversation(contextMessages.length > 0 || localMessages.length > 1);
  }, [contextMessages, localMessages]);

  // Combined data for FlatList to include typing indicator when loading
  const renderData = useMemo(() => {
    // Generate a stable typing indicator object that doesn't change on every render
    const typingIndicator = { 
      id: 'typing-indicator', 
      role: 'typing', 
      content: '', 
      createdAt: loading ? new Date().toISOString() : '' 
    };
      
    // Make a copy of the messages array to ensure proper re-rendering
    return [
      ...contextMessages.map(msg => ({...msg})),
      ...(loading ? [typingIndicator] : [])
    ];
  }, [contextMessages, loading]);
  
  // Optimize FlatList rendering
  const renderMessageItem = useCallback(({ item }: { item: Message | { id: string; role: string; content: string; createdAt: string } }) => {
    if (item.role === 'typing') {
      return <TypingIndicator />;
    }
    return <MessageBubble message={item as Message} />;
  }, []);
  
  // Simplified key extractor that's stable across renders
  const keyExtractor = useCallback((item: Message | { id: string; role: string; content: string; createdAt: string }) => {
    return `${item.id}`;
  }, []);
  
  // Function to handle scrolling to bottom
  const scrollToBottom = () => {
    if (usesFlatList) {
      flatListRef.current?.scrollToEnd({ animated: true });
    } else {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  };
  
  // Function to handle scroll events
  const handleScroll = (event: { nativeEvent: { contentOffset: { y: number }, contentSize: { height: number }, layoutMeasurement: { height: number } } }) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    // Show button if scrolled up a significant amount
    const scrolledUp = contentSize.height - layoutMeasurement.height - contentOffset.y > 200;
    setShowScrollButton(scrolledUp && contextMessages.length > 8);
  };

  // Handle context toggle
  const handleContextToggle = (value: boolean) => {
    if (onToggleContext) {
      onToggleContext(value);
    }
  };

  // Handle new chat
  const handleNewChat = () => {
    if (onNewChat) {
      onNewChat();
    } else {
      startNewConversation();
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingBottom: insets.bottom, backgroundColor: COLORS.background }]}
      behavior={keyboardBehavior}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <StatusBar style="dark" />
      
      <View style={[styles.backgroundPattern, { backgroundColor: COLORS.background }]}>
        
        {/* iOS-style header - only on iOS and mobile views */}
        {isIOS && (
          <View style={styles.header}>
            <TouchableOpacity onPress={navigateToSettings}>
              <MaterialIcons name="person-outline" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <View style={{flex: 1}}/>
            <TouchableOpacity onPress={handleNewChat}>
              <MaterialIcons name="add" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Admin mode header - only shown with adminControls prop */}
        {adminControls && (
          <Surface style={styles.headerContainer} elevation={1}>
            <View style={styles.headerContent}>
              <Text style={[styles.headerText, { color: COLORS.headerText }]}>
                {!loadingPrompts && activePrompt ? `${activePrompt.name}` : 'AI Assistant'}
                {currentModel && <Text style={styles.modelIndicator}> - {currentModel}</Text>}
                {!currentModel && <Text style={styles.modelIndicator}> - Default model</Text>}
                {conversationId && <Text style={styles.conversationIndicator}> (Conversation in progress)</Text>}
              </Text>
              
              {/* Display estimated conversation cost */}
              {showCost && (
                <Text style={styles.costIndicator}>
                  {isNaN(conversationCost) 
                    ? 'Cost: Calculating...' 
                    : `Estimated cost: $${conversationCost.toFixed(6)}`}
                </Text>
              )}
              
              <View style={styles.adminControls}>
                <View style={styles.contextToggleContainer}>
                  <Text style={[styles.contextToggleLabel, { color: COLORS.headerText }]}>User Context:</Text>
                  <Switch
                    value={useUserContext}
                    onValueChange={(value) => {
                      console.log(`[ChatView] User context toggle changed to: ${value}`);
                      handleContextToggle(value);
                    }}
                    trackColor={{ false: COLORS.switchTrackInactive, true: COLORS.switchTrackActive }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                
                {/* Start a new conversation - this is a true reset */}
                <TouchableOpacity 
                  style={styles.newChatButton}
                  onPress={handleNewChat}
                >
                  <Text style={styles.newChatText}>New Chat</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.logoutButton}
                  onPress={signOut}
                >
                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Surface>
        )}
        
        {/* Messages list - FlatList for web, ScrollView for mobile */}
        {usesFlatList ? (
          <FlatList
            ref={flatListRef}
            data={renderData}
            keyExtractor={keyExtractor}
            renderItem={renderMessageItem}
            contentContainerStyle={[
              styles.messagesList,
              !adminControls && styles.userModeMessagesList
            ]}
            style={styles.messagesContainer}
            initialNumToRender={100}
            maxToRenderPerBatch={100}
            windowSize={41}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={false}
            showsVerticalScrollIndicator={true}
            onScroll={handleScroll}
            scrollEventThrottle={400}
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }}
          />
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={[
              styles.messagesContent,
              !adminControls && styles.userModeMessagesList
            ]}
            onScroll={handleScroll}
            scrollEventThrottle={400}
          >
            {displayMessages.map((message) => (
              <View 
                key={isBackendMessage(message) ? message.id : message.id}
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
                    style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
                    color="white"
                  />
                )}
                <View 
                  style={[
                    styles.messageBubble,
                    (isBackendMessage(message) && message.role === 'user') || 
                    (isLocalMessage(message) && message.sender === 'user')
                      ? [styles.userBubble, { backgroundColor: theme.colors.primary }] 
                      : styles.aiBubble
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
                  style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
                  color="white"
                />
                <View style={[styles.messageBubble, styles.aiBubble, styles.loadingBubble]}>
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
                    style={[styles.suggestionChip, { borderColor: theme.colors.primary + '40' }]}
                    onPress={() => handleSuggestionClick(suggestion)}
                  >
                    <Text style={[styles.suggestionText, { color: theme.colors.primary }]}>
                      {suggestion}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        )}
        
        {/* Error message display */}
        {error && (
          <Surface style={styles.errorContainer} elevation={1}>
            <Text style={styles.errorText}>{error}</Text>
          </Surface>
        )}
        
        {/* Scroll to bottom button */}
        {showScrollButton && (
          <FAB
            icon="chevron-down"
            style={[styles.scrollButton, { backgroundColor: COLORS.scrollButtonBackground }]}
            color="#FFFFFF"
            size="small"
            onPress={scrollToBottom}
          />
        )}
        
        {/* Input area - iMessage style for iOS */}
        <View style={styles.inputContainer}>
          {Platform.OS === 'ios' ? (
            <>
              <TextInput 
                style={styles.input}
                placeholder="Message"
                placeholderTextColor="#999"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSend}
                multiline
              />
              
              {!inputText.trim() ? (
                <TouchableOpacity style={styles.mediaButton} onPress={() => console.log('Microphone tapped')}>
                  <MaterialIcons name="mic" size={24} color="#999" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleSend}
                  disabled={loading}
                >
                  <MaterialIcons name="send" size={20} color="white" />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <Surface style={[styles.inputSurface, { backgroundColor: '#FFFFFF' }]} elevation={1}>
                <TextInput
                  mode="outlined"
                  style={[styles.input, { backgroundColor: COLORS.inputBackground }]}
                  placeholder="Message"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  disabled={loading}
                  onKeyPress={handleKeyPress}
                  onSubmitEditing={handleSend}
                  blurOnSubmit={false}
                  right={loading ? Platform.OS === 'web' ? undefined : <TextInput.Icon icon="loading" size={20} /> : null}
                  outlineStyle={styles.inputOutline}
                  theme={{ colors: { primary: COLORS.sendButton } }}
                />
              </Surface>
              <IconButton
                icon="arrow-up"
                mode="contained"
                containerColor={COLORS.sendButton}
                iconColor="#FFFFFF"
                size={22}
                onPress={handleSend}
                disabled={!inputText.trim() || loading}
                style={styles.sendButton}
              />
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = createPlatformStyleSheet({
  container: {
    flex: 1,
  },
  backgroundPattern: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 10,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CCCCCC',
  },
  headerContent: {
    paddingHorizontal: spacing.md,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  conversationIndicator: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  modelIndicator: {
    fontSize: 12,
    color: '#0066CC',
    fontWeight: '500',
  },
  costIndicator: {
    fontSize: 11,
    color: '#34C759',
    marginTop: 2,
    marginBottom: 4,
  },
  adminControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
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
    padding: 6,
    paddingHorizontal: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    marginRight: 8,
  },
  newChatText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  logoutButton: {
    padding: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  messagesList: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  userModeMessagesList: {
    paddingTop: Platform.OS === 'ios' ? 20 : 60, // Extra padding for the toggle in user mode (less on iOS)
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
    padding: 12,
    borderRadius: 20, // More rounded like iMessage
    marginVertical: 1,
    maxWidth: '75%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: Platform.OS === 'ios' ? 4 : 5, // Tailored corner like iMessage
    ...createShadow(1),
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: Platform.OS === 'ios' ? 4 : 5, // Tailored corner like iMessage
    backgroundColor: Platform.OS === 'ios' ? '#e9e9eb' : undefined, // iOS light gray
    ...createShadow(1),
  },
  messageText: {
    fontSize: 16,
    lineHeight: 21, // Tighter line spacing like iMessage
    letterSpacing: -0.2, // Tighter letter spacing like Apple's SF font
  },
  userMessageText: {
    color: 'white',
    fontSize: 16,
  },
  aiMessageText: {
    color: '#000',
    fontSize: 16,
  },
  typingContainer: {
    minWidth: 70,
    minHeight: 36,
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  typingDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 20,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
    opacity: 0.8, // Slightly reduce opacity for softer look
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Platform.OS === 'ios' ? 12 : spacing.md,
    paddingBottom: platformSelect({
      ios: 12,
      android: spacing.lg,
      default: spacing.md
    }),
    backgroundColor: Platform.OS === 'ios' ? 'white' : 'transparent',
    borderTopWidth: Platform.OS === 'ios' ? 1 : 0,
    borderTopColor: '#e0e0e0',
  },
  inputSurface: {
    flex: 1,
    borderRadius: 20, // More rounded corners like iMessage
    marginRight: spacing.sm,
    overflow: 'hidden',
    ...createShadow(1),
  },
  input: {
    flex: 1,
    backgroundColor: Platform.OS === 'ios' ? '#f5f5f5' : undefined,
    borderRadius: 20,
    paddingHorizontal: Platform.OS === 'ios' ? 16 : undefined,
    paddingVertical: Platform.OS === 'ios' ? 10 : undefined,
    marginHorizontal: Platform.OS === 'ios' ? 8 : 0,
    fontSize: 16,
    maxHeight: 120,
  },
  inputOutline: {
    borderRadius: 20, // Match iMessage's more rounded corners
    borderWidth: 0,
  },
  mediaButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    borderRadius: 20, // Perfect circle
    width: 36, // iMessage has a smaller send button
    height: 36, // iMessage has a smaller send button
    margin: 2,
    justifyContent: 'center',
    alignItems: 'center',
    ...createShadow(2),
  },
  errorContainer: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    padding: spacing.md,
    backgroundColor: '#FFCCCC',
    borderRadius: 8,
  },
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
  },
  timeText: {
    fontSize: 10, // Smaller timestamp like iMessage
    marginTop: 2,
    marginHorizontal: 8, // Larger margins like iMessage
    opacity: 0.7, // More subtle timestamp like iMessage
  },
  tailStyle: {
    position: 'absolute',
    width: 8, // Smaller tail like iMessage
    height: 8,
    transform: [{ rotate: '45deg' }],
    bottom: 0,
  },
  userTail: {
    right: 4, // Position closer to edge
  },
  aiTail: {
    left: 4, // Position closer to edge
  },
  // Add scroll button styles
  scrollButton: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    borderRadius: 28,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...createShadow(2),
  },
  systemMessage: {
    padding: 12,
    borderRadius: 20,
    marginVertical: 1,
    backgroundColor: '#007AFF',
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
});

export default ChatView;