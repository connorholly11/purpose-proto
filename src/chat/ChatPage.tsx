import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, StyleSheet, Text } from 'react-native';
import { FAB, Surface, useTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChatContext } from '../context/ChatContext';
import { useNavigation } from '@react-navigation/native';

// Import components from extracted files
import { MessageList } from './list';
import { ChatHeader, IosHeader } from './header';
import { Composer } from './input';

// Import hooks
import { useAutoScroll, useComposer, useAdminToggle } from './hooks';

// Import styles
import { getThemeColors } from './styles';
import { createPlatformStyleSheet, keyboardBehavior, keyboardVerticalOffset } from '../theme';

type ChatPageProps = {
  admin?: boolean;
  platform?: 'ios' | 'android' | 'web';
};

export const ChatPage = ({ 
  admin = false,
  platform = Platform.OS as 'ios' | 'android' | 'web'
}: ChatPageProps) => {
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
  const { useUserContext, handleContextToggle } = useAdminToggle();
  const { 
    inputText, 
    setInputText, 
    handleSend, 
    handleKeyPress 
  } = useComposer(useUserContext);
  const { 
    scrollRef, 
    handleScroll, 
    showScrollButton, 
    scrollToBottom 
  } = useAutoScroll(messages);
  
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
        {platform === 'ios' && !admin && (
          <IosHeader 
            onProfilePress={navigateToProfileSheet}
            onNewChatPress={handleNewChat}
          />
        )}
        
        {/* Admin mode header */}
        <ChatHeader 
          admin={admin}
          conversationId={conversationId}
          currentModel={currentModel}
          conversationCost={conversationCost}
          useUserContext={useUserContext}
          onContextToggle={handleContextToggle}
          onNewChat={handleNewChat}
        />
        
        {/* Messages list */}
        <MessageList
          messages={messages}
          loading={loading}
          onScroll={handleScroll}
          scrollRef={scrollRef}
          admin={admin}
          platform={platform}
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
          platform={platform}
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