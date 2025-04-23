import React, { useCallback, useMemo } from 'react';
import { FlatList, ScrollView, Platform, TouchableOpacity, View, Text } from 'react-native';
import { Avatar } from 'react-native-paper';
import { Message } from '../../context/ChatContext';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { createPlatformStyleSheet, spacing } from '../../theme';

type MessageListProps = {
  messages: Message[];
  loading: boolean;
  onScroll: (event: any) => void;
  scrollRef: React.RefObject<FlatList | ScrollView>;
  platform: 'ios' | 'android';
};

export const MessageList = ({
  messages,
  loading,
  onScroll,
  scrollRef,
  platform,
}: MessageListProps) => {
  // Determine if using FlatList or ScrollView based on platform
  const usesFlatList = platform !== 'ios';
  
  // Local message type guard functions (from original component)
  const isLocalMessage = (message: any): boolean => {
    return 'sender' in message;
  };
  
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
      ...messages.map(msg => ({...msg})),
      ...(loading ? [typingIndicator] : [])
    ];
  }, [messages, loading]);
  
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

  return usesFlatList ? (
    <FlatList
      ref={scrollRef as React.RefObject<FlatList>}
      data={renderData}
      keyExtractor={keyExtractor}
      renderItem={renderMessageItem}
      contentContainerStyle={[
        styles.messagesList,
        styles.userModeMessagesList
      ]}
      style={styles.messagesContainer}
      initialNumToRender={100} 
      maxToRenderPerBatch={100}
      windowSize={41}
      updateCellsBatchingPeriod={50}
      removeClippedSubviews={false}
      showsVerticalScrollIndicator={true}
      onScroll={onScroll}
      scrollEventThrottle={400}
      maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
      onContentSizeChange={() => {
        (scrollRef as React.RefObject<FlatList>).current?.scrollToEnd({ animated: true });
      }}
    />
  ) : (
    <ScrollView
      ref={scrollRef as React.RefObject<ScrollView>}
      style={styles.messagesContainer}
      contentContainerStyle={[
        styles.messagesContent,
        styles.userModeMessagesList
      ]}
      onScroll={onScroll}
      scrollEventThrottle={400}
    >
      {renderData.map((message) => {
        if (message.role === 'typing') {
          return <TypingIndicator key={message.id} />;
        }
        
        return (
          <View 
            key={message.id}
            style={[
              styles.messageRow,
              message.role === 'user' ? styles.userMessageRow : {}
            ]}
          >
            {message.role === 'assistant' && (
              <Avatar.Text 
                size={40} 
                label="A" 
                style={styles.avatar}
                color="white"
              />
            )}
            <MessageBubble message={message} />
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = createPlatformStyleSheet({
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
    backgroundColor: '#1E88E5',
  },
});

export default MessageList;