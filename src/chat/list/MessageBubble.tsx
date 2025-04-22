import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme as usePaperTheme } from 'react-native-paper';
import { Message } from '../../context/ChatContext';
import { getThemeColors } from '../styles';
import { bubbleStyles } from '../styles';
import { useTheme } from '../../context/ThemeContext';

type MessageBubbleProps = {
  message: Message;
};

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const paperTheme = usePaperTheme();
  const { colorTheme, darkMode, getAiPrimary } = useTheme();
  const aiColors = getAiPrimary(colorTheme, darkMode);
  const COLORS = getThemeColors(paperTheme);

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
  
  // Use Pressable for better touch feedback
  return (
    <Pressable style={({pressed}) => [
      bubbleStyles.messageBubble,
      isUserMessage
        ? [bubbleStyles.userBubble, { 
            backgroundColor: pressed ? COLORS.userBubblePressed : COLORS.userBubble 
          }]
        : [bubbleStyles.aiBubble, { 
            backgroundColor: pressed ? aiColors.pressed : aiColors.main 
          }]
    ]}>
      {({pressed}) => (
        <Text style={[
          bubbleStyles.messageText,
          { color: isUserMessage ? COLORS.userText : aiColors.textOn }
        ]}>
          {message.content}
        </Text>
      )}
    </Pressable>
  );
};

export default MessageBubble;