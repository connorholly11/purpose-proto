import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Switch, TouchableOpacity, Animated, ImageBackground } from 'react-native';
import { TextInput, Button, Text, Surface, IconButton, FAB } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChatContext, Message } from '../context/ChatContext';
import { useSystemPrompts } from '../context/SystemPromptContext';
import { useAdminMode } from '../navigation/AppNavigator';
import { useAuthContext } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

// iMessage-inspired colors with consistent scheme
const COLORS = {
  background: '#FFFFFF', // White background like iMessage for conversation area
  userBubble: '#007AFF', // iOS blue bubble color (iMessage blue)
  assistantBubble: '#E9E9EB', // Light gray bubble for received messages
  userText: '#FFFFFF', // White text for user messages
  assistantText: '#000000', // Black text for assistant messages
  inputBackground: '#F2F2F7', // Light gray for input field
  sendButton: '#007AFF', // iOS blue for send button
  header: '#FFFFFF', // White header like iMessage
  headerText: '#8E8E93', // iOS gray for header text
  typingDots: '#8E8E93', // iOS gray for typing dots
  switchTrackActive: '#007AFF', // iOS blue for active switch
  switchTrackInactive: '#E5E5EA', // Light gray for inactive switch
  shadow: 'rgba(0, 0, 0, 0.1)', // Subtle shadow
  userBubbleShadow: 'rgba(0, 87, 178, 0.25)', // Subtle blue shadow
  assistantBubbleShadow: 'rgba(0, 0, 0, 0.1)', // Subtle gray shadow
  inputShadow: 'rgba(0, 0, 0, 0.1)', // Input shadow
  messageTimestamp: '#8E8E93', // iOS gray for timestamp
  scrollButtonBackground: 'rgba(0, 122, 255, 0.9)', // iOS blue with opacity
};

// Component to render typing indicator
const TypingIndicator = () => {
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
          <Animated.View style={[styles.typingDot, { opacity: dot1Opacity }]} />
          <Animated.View style={[styles.typingDot, { opacity: dot2Opacity }]} />
          <Animated.View style={[styles.typingDot, { opacity: dot3Opacity }]} />
        </View>
      </View>
      <View 
        style={[
          styles.tailStyle,
          styles.aiTail,
        ]} 
      />
    </Animated.View>
  );
};

// Component to render a chat message
const MessageBubble = ({ message }: { message: Message }) => {
  const isUser = message.role === 'user';
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));
  
  // Only calculate time once during initial render
  const timeString = useMemo(() => 
    new Date(message.createdAt).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    }),
    [message.createdAt]
  );
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      })
    ]).start();
  }, []);
  
  return (
    <View style={{ marginBottom: 8 }}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          position: 'relative',
          maxWidth: '70%', // Control max width at container level - iMessage is narrower
        }}
      >
        {Platform.OS === 'ios' ? (
          <>
            <Surface 
              style={[
                styles.messageBubble, 
                isUser ? styles.userBubble : styles.aiBubble
              ]}
              elevation={isUser ? 1 : 1}
            >
              <Text style={[
                styles.messageText,
                isUser ? styles.userMessageText : styles.aiMessageText
              ]}>
                {message.content}
              </Text>
            </Surface>
            <View 
              style={[
                styles.tailStyle,
                isUser ? styles.userTail : styles.aiTail,
              ]} 
            />
          </>
        ) : (
          <>
            <View
              style={[
                styles.messageBubble, 
                isUser ? styles.userBubble : styles.aiBubble
              ]}
            >
              <Text style={[
                styles.messageText,
                isUser ? styles.userMessageText : styles.aiMessageText
              ]}>
                {message.content}
              </Text>
            </View>
            <View 
              style={[
                styles.tailStyle,
                isUser ? styles.userTail : styles.aiTail
              ]} 
            />
          </>
        )}
      </Animated.View>
      
      {/* Time indicator */}
      <Text style={[
        styles.timeText, 
        { alignSelf: isUser ? 'flex-end' : 'flex-start' }
      ]}>
        {timeString}
      </Text>
    </View>
  );
};

// Main chat screen component
export const ChatScreen = () => {
  // Get state and functions from ChatContext
  const { messages, loading, error, sendMessage, startNewConversation, conversationId, currentModel, conversationCost } = useChatContext();
  
  // Get system prompts from context
  const { activePrompt, loadingPrompts } = useSystemPrompts();

  // Get admin mode context
  const { isAdminMode, setIsAdminMode } = useAdminMode();
  
  // Get auth context for logout
  const { signOut } = useAuthContext();

  // Local state
  const [inputText, setInputText] = useState('');
  const [useUserContext, setUseUserContext] = useState(true);
  
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  
  // Add new state for scroll visibility
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  // Function to handle sending a message using the context
  const handleSend = async () => {
    if (inputText.trim() && !loading) {
      console.log('[ChatScreen] Send button pressed');
      console.log(`[ChatScreen] Message to send: "${inputText.substring(0, 30)}${inputText.length > 30 ? '...' : ''}"`);
      console.log(`[ChatScreen] User context enabled: ${useUserContext}`);
      console.log(`[ChatScreen] Current conversation ID: ${conversationId || 'New conversation'}`);
      
      const messageText = inputText;
      setInputText(''); // Clear input immediately

      try {
        console.log('[ChatScreen] Calling ChatContext.sendMessage()');
        // Call the context's sendMessage function with just the message and user context
        await sendMessage(
          messageText,
          undefined,
          false,
          useUserContext
        );
        console.log('[ChatScreen] Message sent and response received successfully');
      } catch (err) {
        // Error is handled within the context, but you could add extra UI feedback if needed
        console.error('[ChatScreen] Error sending message:', err);
      }
    } else {
      console.log(`[ChatScreen] Send attempted but conditions not met:
      - Has text: ${Boolean(inputText.trim())}
      - Not loading: ${!loading}`);
    }
  };
  
  // Handle key press for the text input
  const handleKeyPress = (e: any) => {
    // Check if Enter was pressed without the Shift key
    if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault(); // Prevent default behavior (new line)
      handleSend();
    }
  };
  
  // Only scroll to the bottom when new messages arrive, don't force re-renders during typing
  const previousMessageCount = useRef(0);
  
  useEffect(() => {
    // Only log and take action if the message count actually changed
    if (messages.length !== previousMessageCount.current) {
      console.log(`[ChatScreen] Message count changed to: ${messages.length}`);
      if (messages.length >= 5) {
        console.log(`[ChatScreen] We now have ${messages.length} messages (5+ threshold reached)`);
      }
      
      // Always scroll to bottom regardless of message count
      // Use immediate scroll for larger message counts to prevent animation glitches
      const shouldUseAnimation = messages.length < 50;
      
      // Scroll to bottom with a short delay to ensure layout is complete
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: shouldUseAnimation });
          
          // For large message counts, double-check scrolling with a second attempt
          if (messages.length > 30) {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }, 200);
          }
        }
      }, 100);
      
      // Update the previous count
      previousMessageCount.current = messages.length;
    }
  }, [messages]);

  // Helper to toggle admin mode
  const toggleAdminMode = () => setIsAdminMode(!isAdminMode);

  // Combined data for FlatList to include typing indicator when loading
  // Return to using useMemo for renderData to prevent unnecessary re-renders
  // This avoids the flashing when typing in the input field
  // Extract messagesToDisplay outside of useMemo to use as a dependency
  const messagesToDisplay = useMemo(() => {
    // Show all messages instead of limiting to 100
    return messages;
  }, [messages]);
  
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
    const result = [
      ...messagesToDisplay.map(msg => ({...msg})),
      ...(loading ? [typingIndicator] : [])
    ];
    
    // Only log when messages or loading state changes
    console.log(`[ChatScreen] Render data prepared with ${result.length} items (${messagesToDisplay.length} messages of ${messages.length} total + ${loading ? '1 typing indicator' : '0 typing indicators'})`);
    
    return result;
  }, [messagesToDisplay, loading, messages.length]); // Include messages.length in dependencies
  
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
    flatListRef.current?.scrollToEnd({ animated: true });
  };
  
  // Function to handle scroll events
  const handleScroll = (event: { nativeEvent: { contentOffset: { y: number }, contentSize: { height: number }, layoutMeasurement: { height: number } } }) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    // Show button if scrolled up a significant amount
    const scrolledUp = contentSize.height - layoutMeasurement.height - contentOffset.y > 200;
    setShowScrollButton(scrolledUp && messages.length > 8);
  };
  
  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar style="dark" />
      
      <View style={styles.backgroundPattern}>
        
        {/* Admin mode header - only shown in admin mode */}
        {isAdminMode && (
          <View style={styles.headerContainer}>
            <View style={styles.headerContent}>
              <Text style={styles.headerText}>
                {!loadingPrompts && activePrompt ? `${activePrompt.name}` : 'AI Assistant'}
                {currentModel && <Text style={styles.modelIndicator}> - {currentModel}</Text>}
                {!currentModel && <Text style={styles.modelIndicator}> - Default model</Text>}
                {conversationId && <Text style={styles.conversationIndicator}> (Conversation in progress)</Text>}
              </Text>
              
              {/* Display estimated conversation cost */}
              <Text style={styles.costIndicator}>
                {isNaN(conversationCost) 
                  ? 'Cost: Calculating...' 
                  : `Estimated cost: $${conversationCost.toFixed(6)}`}
              </Text>
              
              <View style={styles.adminControls}>
                <View style={styles.contextToggleContainer}>
                  <Text style={styles.contextToggleLabel}>User Context:</Text>
                  <Switch
                    value={useUserContext}
                    onValueChange={() => {
                      const newValue = !useUserContext;
                      console.log(`[ChatScreen] User context toggle changed to: ${newValue}`);
                      setUseUserContext(newValue);
                    }}
                    trackColor={{ false: COLORS.switchTrackInactive, true: COLORS.switchTrackActive }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                
                {/* Start a new conversation - this is a true reset */}
                <TouchableOpacity 
                  style={styles.newChatButton}
                  onPress={() => {
                    console.log('[ChatScreen] New Chat button pressed');
                    startNewConversation();
                  }}
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
          </View>
        )}
        
        {/* User/Admin toggle - always visible but positioned differently based on mode */}
        <View style={[
          styles.adminToggleContainer,
          isAdminMode ? styles.adminToggleAdmin : styles.adminToggleUser
        ]}>
          <Text style={styles.toggleLabel}>User</Text>
          <Switch
            value={isAdminMode}
            onValueChange={toggleAdminMode}
            trackColor={{ false: COLORS.switchTrackInactive, true: COLORS.switchTrackActive }}
            thumbColor="#FFFFFF"
            style={styles.switch}
          />
          <Text style={styles.toggleLabel}>Admin</Text>
        </View>
        
        {/* Messages list */}
        <FlatList
          ref={flatListRef}
          data={renderData}
          keyExtractor={keyExtractor}
          renderItem={renderMessageItem}
          contentContainerStyle={[
            styles.messagesList,
            !isAdminMode && styles.userModeMessagesList
          ]}
          style={styles.messagesContainer}
          initialNumToRender={100} // Increased further to handle more messages
          maxToRenderPerBatch={100} // Increased for better performance
          windowSize={41} // Increased to ensure more messages remain in memory
          updateCellsBatchingPeriod={50} // Faster updates
          removeClippedSubviews={false} // Critical: Keep all messages in memory
          showsVerticalScrollIndicator={true}
          onScroll={handleScroll}
          scrollEventThrottle={400}
          maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
          extraData={renderData.length} // Use length to force re-render when messages change
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
        />
        
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
            style={styles.scrollButton}
            color="#FFFFFF"
            size="small"
            onPress={scrollToBottom}
          />
        )}
        
        {/* Input area */}      
        <View style={styles.inputContainer}>
          <Surface style={styles.inputSurface} elevation={1}>
            <TextInput
              mode="outlined"
              style={styles.input}
              placeholder="iMessage"
              value={inputText}
              onChangeText={setInputText}
              multiline
              disabled={loading}
              onKeyPress={handleKeyPress}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
              right={loading ? <TextInput.Icon icon="loading" size={20} /> : null}
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
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backgroundPattern: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    backgroundColor: COLORS.header, // White header like iMessage
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CCCCCC',
  },
  headerContent: {
    paddingHorizontal: 16,
  },
  headerText: {
    fontSize: 14,
    color: COLORS.headerText,
    fontWeight: '500',
    marginBottom: 8,
  },
  conversationIndicator: {
    fontSize: 12,
    color: '#007AFF', // iOS blue
    fontStyle: 'italic',
  },
  modelIndicator: {
    fontSize: 12,
    color: '#0066CC', // Darker blue for model info
    fontWeight: '500',
  },
  costIndicator: {
    fontSize: 11,
    color: '#34C759', // Green for cost
    marginTop: 2,
    marginBottom: 4,
  },
  adminToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: COLORS.header, // White header like iMessage
  },
  adminToggleAdmin: {
    position: 'absolute',
    top: 10,
    right: 16,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  adminToggleUser: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CCCCCC',
  },
  toggleLabel: {
    fontSize: 12,
    color: COLORS.headerText,
    marginHorizontal: 4,
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  adminControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contextToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contextToggleLabel: {
    fontSize: 13,
    color: COLORS.headerText,
    marginRight: 8,
  },
  newChatButton: {
    padding: 6,
    paddingHorizontal: 12,
    backgroundColor: '#4CAF50',  // Green color for new chat
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
    backgroundColor: COLORS.background,
  },
  messagesList: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  userModeMessagesList: {
    paddingTop: 60, // Extra padding for the toggle in user mode
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20, // More rounded like iMessage
    marginVertical: 1,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.userBubble,
    borderBottomRightRadius: 5, // Tailored corner like iMessage
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.15)',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 1,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.assistantBubble,
    borderBottomLeftRadius: 5, // Tailored corner like iMessage
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  messageText: {
    fontSize: 16,
    lineHeight: 21, // Tighter line spacing like iMessage
    letterSpacing: -0.2, // Tighter letter spacing like Apple's SF font
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', // Use System font on iOS for SF Pro
  },
  userMessageText: {
    color: COLORS.userText,
    fontWeight: '400', // Regular weight
  },
  aiMessageText: {
    color: COLORS.assistantText,
    fontWeight: '400', // Regular weight
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
    backgroundColor: '#8E8E93', // Fixed color for typing dots
    marginHorizontal: 3,
    opacity: 0.8, // Slightly reduce opacity for softer look
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 16,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    alignItems: 'flex-end',
  },
  inputSurface: {
    flex: 1,
    borderRadius: 20, // More rounded corners like iMessage
    marginRight: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF', // White container around input
    ...Platform.select({
      ios: {
        shadowColor: COLORS.inputShadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  input: {
    flex: 1,
    marginRight: 0,
    maxHeight: 120,
    backgroundColor: COLORS.inputBackground, // Gray input field
    borderRadius: 20, // Match iMessage's more rounded corners
    fontSize: 16, // iMessage text size
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  inputOutline: {
    borderRadius: 20, // Match iMessage's more rounded corners
    borderWidth: 0,
  },
  sendButton: {
    borderRadius: 20, // Perfect circle
    width: 36, // iMessage has a smaller send button
    height: 36, // iMessage has a smaller send button
    margin: 2,
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: COLORS.userBubbleShadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3, // More subtle shadow like iMessage
        shadowRadius: 2,
      },
    }),
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
  timeText: {
    fontSize: 10, // Smaller timestamp like iMessage
    color: COLORS.messageTimestamp,
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
    backgroundColor: COLORS.userBubble,
  },
  aiTail: {
    left: 4, // Position closer to edge
    backgroundColor: COLORS.assistantBubble,
  },
  // Add scroll button styles
  scrollButton: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    backgroundColor: COLORS.scrollButtonBackground,
    borderRadius: 28,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.3)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});

export default ChatScreen;
