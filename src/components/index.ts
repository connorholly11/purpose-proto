export { Row, Column, Section, Card } from './layout';

// Chat components
export { default as UserChat } from './chat/UserChat';

// Forward ChatView to ChatPage (compatibility layer)
import { ChatPage } from '../chat';
import { Platform } from 'react-native';
import React from 'react';

/**
 * @deprecated Use ChatPage from '../chat' directly
 */
export const ChatView = (props: any) => React.createElement(ChatPage, props);