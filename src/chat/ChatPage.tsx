import React, { useState, useEffect, useRef } from 'react';
import { View, KeyboardAvoidingView, Platform, StyleSheet, Text } from 'react-native';
import { FAB, Surface, useTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChatContext, Message } from '../context/ChatContext';
import { useNavigation } from '@react-navigation/native';
import { useHaptics } from '../context/HapticsContext';
import * as Haptics from 'expo-haptics';

// Import components from extracted files
import { MessageList } from './list';
import { IosHeader } from './header';
import { Composer } from './input';

// Import hooks
import { useAutoScroll, useComposer } from './hooks';

// Import styles
import { getThemeColors } from './styles';
import { createPlatformStyleSheet, keyboardBehavior, keyboardVerticalOffset } from '../theme';

type ChatPageProps = {};

// Helper hook to get the previous value
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => { ref.current = value; }, [value]);
  return ref.current;
}

export const ChatPage = ({}: ChatPageProps) => {
  const theme = useTheme();
  const COLORS = getThemeColors(theme);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // Get state and functions from ChatContext
  const { 
    messages, 
    loading, 
    error, 
    startNewConversation, 
    conversationId, 
    currentModel, 
    conversationCost 
  } = useChatContext();
  
  // Use our custom hooks
  const { 
    inputText, 
    setInputText, 
    handleSend, 
    handleKeyPress 
  } = useComposer(true); // Always use user context by default
  const { 
    scrollRef, 
    handleScroll, 
    showScrollButton, 
    scrollToBottom 
  } = useAutoScroll(messages);
  
  // Haptics logic
  const { trigger, hapticsEnabled } = useHaptics();
  const prevMessages = usePrevious(messages);

  useEffect(() => {
    if (!hapticsEnabled) return;

    if (
      prevMessages &&                             // have a prior snapshot
      messages.length > prevMessages.length       // a new message appended
    ) {
      const newMsg = messages[messages.length - 1];
      // Assuming Message type has a 'role' property
      if (newMsg.role === 'assistant') {          // AI only
        trigger(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [messages, prevMessages, hapticsEnabled, trigger]);
  
  // Navigate to the profile sheet modal on iOS
  const navigateToProfileSheet = () => {
    // Type assertion needed for stack navigator
    navigation.navigate('ProfileSheet' as never); 
  };
  
  // Handle starting a new chat
  const handleNewChat = () => {
    startNewConversation();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingBottom: insets.bottom, backgroundColor: COLORS.background }]}
      behavior={keyboardBehavior}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <StatusBar style="dark" />
      
      <View style={[styles.backgroundPattern, { backgroundColor: COLORS.background }]}>
        
        {/* iOS-style header - only on iOS */}
        {Platform.OS === 'ios' && (
          <IosHeader 
            onProfilePress={navigateToProfileSheet}
            onNewChatPress={handleNewChat}
          />
        )}
        
        {/* Messages list */}
        <MessageList
          messages={messages}
          loading={loading}
          onScroll={handleScroll}
          scrollRef={scrollRef}
          platform={Platform.OS as 'ios' | 'android'}
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
            style={[styles.scrollButton, { backgroundColor: COLORS.scrollButtonBackground }]}
            color="#FFFFFF"
            size="small"
            onPress={scrollToBottom}
          />
        )}
        
        {/* Input area */}
        <Composer
          inputText={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
          onKeyPress={handleKeyPress}
          loading={loading}
        />
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
  errorContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    backgroundColor: '#FFCCCC',
    borderRadius: 8,
  },
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
  },
  scrollButton: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    borderRadius: 28,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow styling handled by the FAB component
  },
});

export default ChatPage;