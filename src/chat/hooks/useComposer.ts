import { useState } from 'react';
import { useChatContext } from '../../context/ChatContext';

export const useComposer = (useUserContext: boolean = true) => {
  const [inputText, setInputText] = useState('');
  const { sendMessage, loading } = useChatContext();

  // Function to handle sending a message
  const handleSend = async () => {
    if (inputText.trim() && !loading) {
      const messageText = inputText;
      setInputText(''); // Clear input immediately

      try {
        await sendMessage(
          messageText,
          undefined,
          false,
          useUserContext
        );
      } catch (err) {
        console.error('Error sending message:', err);
      }
    }
  };

  // Handle key press for the text input
  const handleKeyPress = (e: any) => {
    // Check if Enter was pressed without the Shift key
    if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault(); // Prevent default behavior (new line)
      handleSend();
    }
  };

  // Handle suggestion chip click
  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion);
    // We need to manually trigger send since we can't await state update
    sendMessage(suggestion, undefined, false, useUserContext);
  };

  return {
    inputText,
    setInputText,
    handleSend,
    handleKeyPress,
    handleSuggestionClick,
    isLoading: loading
  };
};

export default useComposer;