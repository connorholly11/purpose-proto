import { MD3Theme } from 'react-native-paper';

import { useTheme as useContextTheme } from '../../context/ThemeContext';

// Fixed iMessage blue color for user bubbles
export const USER_BUBBLE_COLOR = '#0A84FF';

// Theme colors that will pull from the global theme
export const getThemeColors = (theme: MD3Theme) => ({
  background: theme.colors.background,
  userBubble: USER_BUBBLE_COLOR, // Fixed iOS blue for user bubbles
  userBubblePressed: '#0071E3', // Darker variant for pressed state
  assistantBubble: theme.colors.primary, // Use theme primary color for AI bubbles
  userText: '#FFFFFF',
  assistantText: '#FFFFFF', // White text on colored AI bubbles
  inputBackground: theme.colors.surfaceInput || theme.colors.surfaceVariant,
  sendButton: USER_BUBBLE_COLOR, // Match send button to user bubbles
  header: theme.colors.surfaceHeader || theme.colors.surface,
  headerText: theme.colors.onSurfaceVariant,
  typingDots: theme.colors.onSurfaceVariant,
  switchTrackActive: theme.colors.primary,
  switchTrackInactive: '#E5E5EA',
  shadow: 'rgba(0, 0, 0, 0.1)',
  userBubbleShadow: 'rgba(0, 87, 178, 0.25)',
  assistantBubbleShadow: 'rgba(0, 0, 0, 0.1)',
  inputShadow: 'rgba(0, 0, 0, 0.1)',
  messageTimestamp: theme.colors.onSurfaceVariant,
  scrollButtonBackground: `${USER_BUBBLE_COLOR}E6`,
});

// Hook that combines Paper theme with our custom theme helpers
export const useChatTheme = () => {
  const { paperTheme, getAiPrimary, colorTheme, darkMode } = useContextTheme();
  const colors = getThemeColors(paperTheme);
  const aiColors = getAiPrimary(colorTheme, darkMode);
  
  return {
    ...colors,
    aiColors,
  };
};