export { default as AppHeader } from './AppHeader';
export { default as FeedbackButton } from './FeedbackButton';
export { Row, Column, Section, Card } from './layout';
export { GameLevelIndicator, LockedOverlay, GameBadge, HolographicCard, DiamondIndicator } from './dashboard';
export { PulseIndicator } from './animations';

// Chat components
export { default as AdminChat } from './chat/AdminChat';
export { default as UserChat } from './chat/UserChat';

// Forward ChatView to ChatPage (compatibility layer)
import { ChatPage } from '../chat';
import { Platform } from 'react-native';
import React from 'react';

/**
 * @deprecated Use ChatPage from '../chat' directly
 */
export const ChatView = (props: any) => React.createElement(ChatPage, {
  ...props,
  platform: Platform.OS as 'ios' | 'android' | 'web'
});