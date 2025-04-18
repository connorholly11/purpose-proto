import { StyleSheet, Platform } from 'react-native';
import { createPlatformStyleSheet, createShadow } from '../../theme';

export const bubbleStyles = createPlatformStyleSheet({
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
  systemMessage: {
    padding: 12,
    borderRadius: 20,
    marginVertical: 1,
    backgroundColor: '#007AFF',
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
  // Typing indicator styles
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
});