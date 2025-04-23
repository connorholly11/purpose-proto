import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ChatProvider, useChatContext } from '../src/context/ChatContext';
import * as SpeechRecognition from 'expo-speech-recognition';
import axios from 'axios';
import { TextInput, Button, Text, View } from 'react-native'; // Import Text and View

// Mock dependencies
jest.mock('axios', () => ({
  post: jest.fn(),
  isAxiosError: jest.fn()
}));
// SpeechRecognition is mocked in setup.js

// A test component to interact with the ChatContext
const TestComponent = () => {
  const { 
    messages, 
    inputText, 
    setInputText, 
    sendMessage, 
    loading, 
    startRecording,
    stopRecording,
    tokenCost 
  } = useChatContext();
  
  // Wrapper for sendMessage to match onPress signature if needed
  const handleSend = () => {
    if (inputText.trim()) {
      sendMessage(inputText); // Assuming sendMessage takes the text
    }
  };

  return (
    <View> { /* Wrap elements in a View */ }
      <TextInput 
        testID="messageInput"
        value={inputText}
        onChangeText={text => setInputText(text)}
        placeholder="Type or speak..."
      />
      <Button 
        testID="sendButton" 
        title="Send" 
        onPress={handleSend} // Use the wrapper function
        disabled={loading || !inputText.trim()} 
      />
      <Button 
        testID="micButton" 
        title={loading ? 'Stop Recording' : 'Start Recording'}
        onPress={loading ? stopRecording : startRecording}
      />
      <Text testID="tokenCost">{tokenCost || 0}</Text> { /* Use Text instead of div */ }
      <Text testID="messageCount">{messages.length}</Text> { /* Use Text instead of div */ }
    </View>
  );
};

describe('ChatContext (iOS)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Define global property for type safety if needed, or cast
    (global as any).speechRecognitionListener = undefined; 
  });
  
  test('should update input text with speech recognition results', async () => {
    const { getByTestId } = render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );
    
    fireEvent.press(getByTestId('micButton'));
    
    await waitFor(() => {
      expect(SpeechRecognition.startAsync).toHaveBeenCalled();
    });

    const simulatedTranscript = 'Hello from speech recognition';
    // Use the global helper, casting global to any to avoid TS error
    (global as any).simulateSpeechResult(simulatedTranscript);
    
    await waitFor(() => {
      expect(getByTestId('messageInput').props.value).toBe(simulatedTranscript);
    });
  });
  
  test('should calculate and display token cost when sending a message', async () => {
    const mockApiResponse = {
      data: {
        reply: 'AI response after calculation',
        tokenUsage: { 
          promptTokens: 10,
          completionTokens: 15,
          totalTokens: 25
        },
        conversationId: 'new-convo-123',
        isNewConversation: true
      }
    };
    (axios.post as jest.Mock).mockResolvedValueOnce(mockApiResponse);
    
    const { getByTestId } = render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );
    
    const userMessage = 'Calculate my tokens';
    fireEvent.changeText(getByTestId('messageInput'), userMessage);
    fireEvent.press(getByTestId('sendButton'));
    
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/chat'),
        expect.objectContaining({ message: userMessage })
      );
      
      // Check Text component's children prop for content
      expect(getByTestId('tokenCost').props.children).toBe(25);
      expect(getByTestId('messageCount').props.children).toBe(2);
    });
  });
});