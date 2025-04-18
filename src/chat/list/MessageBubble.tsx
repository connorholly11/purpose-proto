import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Message } from '../../context/ChatContext';
import { getThemeColors } from '../styles';
import { bubbleStyles } from '../styles';

type MessageBubbleProps = {
  message: Message;
};

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const theme = useTheme();
  const COLORS = getThemeColors(theme);

  // For system messages (rare), render a system bubble
  if (message.role === 'assistant' && message.content.startsWith('[System]')) {
    return (
      <View style={bubbleStyles.systemMessage}>
        <Text style={{ color: '#FFFFFF' }}>{message.content.replace('[System]', '').trim()}</Text>
      </View>
    );
  }

  // Render a regular text bubble based on sender
  const isUserMessage = message.role === 'user';
  
  return (
    <View style={[
      bubbleStyles.messageBubble,
      isUserMessage
        ? [bubbleStyles.userBubble, { backgroundColor: COLORS.userBubble }]
        : [bubbleStyles.aiBubble, { backgroundColor: COLORS.assistantBubble }]
    ]}>
      <Text style={[
        bubbleStyles.messageText,
        { color: isUserMessage ? COLORS.userText : COLORS.assistantText }
      ]}>
        {message.content}
      </Text>
    </View>
  );
};

export default MessageBubble;