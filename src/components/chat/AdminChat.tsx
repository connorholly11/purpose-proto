import React from 'react';
import { Platform } from 'react-native';
import { ChatPage } from '../../chat';

export const AdminChat = () => {
  return (
    <ChatPage 
      admin={true}
      platform={Platform.OS as 'ios' | 'android' | 'web'}
    />
  );
};

export default AdminChat;