import React from 'react';
import { Platform } from 'react-native';
import { ChatPage } from '../../chat';
import { useNavigation } from '@react-navigation/native';

export const UserChat = () => {
  const navigation = useNavigation();
  
  // Make sure the component supports the ProfileSheet navigation
  React.useEffect(() => {
    const handleProfileSheet = () => {
      navigation.navigate('ProfileSheet' as never);
    };
    
    // Expose the function for other components
    (global as any).navigateToProfileSheet = handleProfileSheet;
    
    return () => {
      // Clean up when component unmounts
      (global as any).navigateToProfileSheet = undefined;
    };
  }, [navigation]);
  
  return (
    <ChatPage />
  );
};

export default UserChat;