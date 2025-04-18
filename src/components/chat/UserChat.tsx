import React from 'react';
import { Platform } from 'react-native';
import { ChatPage } from '../../chat';

export const UserChat = () => {
  return (
    <ChatPage 
      admin={false}
      platform={Platform.OS as 'ios' | 'android' | 'web'}
    />
  );
};

export default UserChat;