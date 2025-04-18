import { MD3Theme } from 'react-native-paper';

// Theme colors that will pull from the global theme
export const getThemeColors = (theme: MD3Theme) => ({
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