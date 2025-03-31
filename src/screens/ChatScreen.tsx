import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { TextInput, Button, Text, Surface, MD3Colors, Checkbox, TouchableRipple, Divider, Card, Chip, List } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChatContext, Message } from '../context/ChatContext';
import { useApi } from '../hooks/useApi';
import { MaterialIcons } from '@expo/vector-icons';

// Define type for system prompts
type SystemPrompt = {
  id: string;
  name: string;
  promptText: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// Debug response type
// This is now managed within ChatContext, but kept here for reference if needed
// type DebugInfo = {
// ...
// };

// Component to render a chat message
const MessageBubble = ({ message }: { message: Message }) => {
  const isUser = message.role === 'user';
  
  return (
    <Surface 
      style={[
        styles.messageBubble, 
        isUser ? styles.userBubble : styles.aiBubble
      ]}
      elevation={1}
    >
      <Text style={styles.messageText}>{message.content}</Text>
    </Surface>
  );
};

// Main chat screen component
export const ChatScreen = () => {
  // Get state and functions from ChatContext, including debugInfo
  const { messages, loading, error, sendMessage, debugInfo } = useChatContext();
  const [inputText, setInputText] = useState('');
  const [debugExpanded, setDebugExpanded] = useState(false);
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [isDebugEnabled, setIsDebugEnabled] = useState(false);
  // Removed local debugInfo state, now using context's debugInfo
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  // API instance
  const api = useApi(); // Use the hook
  
  // Load system prompts on component mount
  useEffect(() => {
    loadSystemPrompts();
  }, []);
  
  // Load system prompts from the backend
  const loadSystemPrompts = async () => {
    try {
      setLoadingPrompts(true);
      const prompts = await api.admin.getSystemPrompts();
      setSystemPrompts(prompts);
      // Find the default active prompt to potentially pre-select or indicate
      const activePrompt = prompts.find(p => p.isActive);
      // You could set selectedPromptId to activePrompt.id here if desired,
      // but null represents using the backend's default active one.
    } catch (err) {
      console.error('Failed to load system prompts:', err);
      // Handle error display if needed
    } finally {
      setLoadingPrompts(false);
    }
  };
  
  // Function to handle sending a message using the context
  const handleSend = async () => {
    if (inputText.trim() && !loading) {
      const messageText = inputText;
      setInputText(''); // Clear input immediately

      try {
        // Call the context's sendMessage function, passing debug options
        await sendMessage(
          messageText,
          selectedPromptId || undefined, // Pass override ID or undefined
          isDebugEnabled // Pass debug request flag
        );
        // Debug info is now handled and stored within the context
      } catch (err) {
        // Error is handled within the context, but you could add specific UI feedback here if needed
        console.error('Error sending message (from ChatScreen):', err);
      }
    }
  };
  
  // Scroll to the bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100); // Short delay ensures layout is complete
    }
  }, [messages]);
  
  // Format the debug timestamp for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid Date';
    }
  };
  
  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingBottom: insets.bottom }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} // Adjust as needed
    >
      <StatusBar style="auto" />
      
      {/* Debug Panel */}
      <Card style={styles.debugCard}>
        <TouchableRipple onPress={() => setDebugExpanded(!debugExpanded)}>
          <View style={styles.debugHeader}>
            <Text style={styles.debugTitle}>Debug Tools</Text>
            <MaterialIcons 
              name={debugExpanded ? "expand-less" : "expand-more"} 
              size={24} 
              color="#666"
            />
          </View>
        </TouchableRipple>
        
        {debugExpanded && (
          <Card.Content>
            <View style={styles.debugControls}>
              <View style={styles.promptSelector}>
                <Text style={styles.promptSelectorTitle}>Override System Prompt:</Text>
                
                {loadingPrompts ? (
                  <ActivityIndicator size="small" style={styles.smallLoader} />
                ) : (
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.promptChips}
                  >
                    <Chip
                      selected={selectedPromptId === null}
                      onPress={() => setSelectedPromptId(null)}
                      style={styles.promptChip}
                      mode="outlined" // Use outlined for better selection indication
                    >
                      Default (Active)
                    </Chip>
                    
                    {systemPrompts.map(prompt => (
                      <Chip
                        key={prompt.id}
                        selected={selectedPromptId === prompt.id}
                        onPress={() => setSelectedPromptId(prompt.id)}
                        style={styles.promptChip}
                        mode="outlined" // Use outlined for better selection indication
                      >
                        {prompt.name}
                      </Chip>
                    ))}
                  </ScrollView>
                )}
              </View>
              
              <Divider style={styles.divider} />
              
              <View style={styles.debugSwitch}>
                <Text>Show Debug Info</Text>
                <Checkbox.Android // Use Checkbox.Android or Checkbox.IOS explicitly if needed
                  status={isDebugEnabled ? 'checked' : 'unchecked'}
                  onPress={() => setIsDebugEnabled(!isDebugEnabled)}
                />
              </View>
            </View>
            
            {/* Debug Info Display - Reads from context's debugInfo */}
            {isDebugEnabled && debugInfo && (
              <View style={styles.debugInfoContainer}>
                <Divider style={styles.divider} />
                <Text style={styles.debugInfoTitle}>Last Message Debug Info:</Text>
                <Text style={styles.debugInfoTime}>
                  Timestamp: {formatDate(debugInfo.timestamp)}
                </Text>
                
                <List.Accordion
                  title="Prompt Used"
                  id="prompt-accordion" // Add unique id for accessibility/testing
                  style={styles.debugAccordion}
                  titleStyle={styles.debugAccordionTitle}
                >
                  <View style={styles.debugInfoContent}>
                    <Text style={styles.debugInfoKey}>Name:</Text>
                    <Text style={styles.debugInfoValue}>{debugInfo.systemPromptUsedName}</Text>
                    <Text style={styles.debugInfoKey}>ID:</Text>
                    <Text style={styles.debugInfoValue}>{debugInfo.systemPromptUsedId}</Text>
                  </View>
                </List.Accordion>
                
                <List.Accordion
                  title="Memory Summary Context"
                  id="memory-accordion" // Add unique id
                  style={styles.debugAccordion}
                  titleStyle={styles.debugAccordionTitle}
                >
                  <View style={styles.debugInfoContent}>
                    <Text style={styles.debugInfoValue}>
                      {debugInfo.summaryContextInjected || 'No summary context.'}
                    </Text>
                  </View>
                </List.Accordion>
              </View>
            )}
          </Card.Content>
        )}
      </Card>
      
      {/* Messages list */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={styles.messagesList}
        style={styles.messagesContainer}
        // Optimization: removeClippedSubviews={true} // Can improve performance on long lists
        // Optimization: initialNumToRender={10} // Render fewer items initially
        // Optimization: maxToRenderPerBatch={5} // Control batch rendering
        // Optimization: windowSize={10} // Control the rendering window size
      />
      
      {/* Error message display */}
      {error && (
        <Surface style={styles.errorContainer} elevation={1}>
          <Text style={styles.errorText}>{error}</Text>
        </Surface>
      )}
      
      {/* Input area */}      
      <View style={styles.inputContainer}>
        <TextInput
          mode="outlined"
          style={styles.input}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          disabled={loading} // Disable input while loading
          right={loading ? <TextInput.Icon icon="loading" size={20} /> : null} // Show loading in input
        />
        <Button 
          mode="contained" 
          onPress={handleSend} 
          style={styles.sendButton}
          disabled={!inputText.trim() || loading} // Disable send if empty or loading
          // Remove loading prop from Button as it's shown in TextInput
        >
          Send
        </Button>
      </View>
      
      {/* Loading indicator overlay (optional, could rely on input indicator) */}
      {/* {loading && (
        <View style={styles.loadingIndicator}>
          <ActivityIndicator size="small" color={MD3Colors.primary60} />
          <Text style={styles.loadingText}>AI is thinking...</Text>
        </View>
      )} */}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  debugCard: {
    margin: 8,
    marginBottom: 4, // Reduce bottom margin slightly
    overflow: 'hidden',
    backgroundColor: '#ffffff', // Ensure background color
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12, // Adjust padding
    paddingHorizontal: 16,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugControls: {
    padding: 8,
  },
  promptSelector: {
    marginBottom: 16,
  },
  promptSelectorTitle: {
    fontSize: 14,
    paddingHorizontal: 0, // Remove padding if Card.Content has it
    marginBottom: 8,
  },
  promptChips: {
    flexDirection: 'row',
    paddingBottom: 4, // Add padding for scrollbar space if needed
  },
  promptChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 8,
  },
  debugSwitch: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0, // Remove padding if Card.Content has it
    minHeight: 40, // Ensure minimum height for touch target
  },
  debugInfoContainer: {
    marginTop: 8,
  },
  debugInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  debugInfoTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  debugAccordion: {
    paddingVertical: 0, // Reduce padding
    paddingHorizontal: 0,
    backgroundColor: '#f9f9f9', // Light background for accordion header
    minHeight: 40, // Ensure minimum height
  },
  debugAccordionTitle: {
    fontSize: 14,
  },
  debugInfoContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#ffffff', // White background for content
  },
  debugInfoKey: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
    color: '#333',
  },
  debugInfoValue: {
    fontSize: 12,
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginTop: 2,
    marginBottom: 6,
    color: '#000',
    // Allow text selection on web
    userSelect: Platform.OS === 'web' ? 'text' : undefined,
  },
  smallLoader: {
    marginVertical: 8,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 8, // Reduce top padding
    paddingBottom: 8,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '85%', // Slightly increase max width
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: MD3Colors.primary80, // Consider primary color from theme
    borderBottomRightRadius: 4, // Add slight variation
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4, // Add slight variation
  },
  messageText: {
    fontSize: 16,
    color: '#000000', // Ensure text color for AI bubble
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    paddingBottom: Platform.OS === 'ios' ? 8 : 12, // Adjust padding for different OS
    backgroundColor: '#ffffff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#dddddd',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    marginRight: 8,
    maxHeight: 100, // Limit input height
    backgroundColor: '#ffffff', // Ensure background for outlined input
  },
  sendButton: {
    borderRadius: 20, // Make it rounder
    height: 40, // Match input height better
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 0 : 4, // Align button better on Android
  },
  errorContainer: {
    marginHorizontal: 16, // Match list padding
    marginVertical: 8,
    padding: 12, // Increase padding
    backgroundColor: MD3Colors.errorContainer, // Use theme color
    borderRadius: 8,
  },
  errorText: {
    color: MD3Colors.onError, // Use theme color
    textAlign: 'center',
  },
  loadingIndicator: {
    position: 'absolute',
    bottom: 70,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 16,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4, // Add elevation
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  // Optional loading indicator style (if re-enabled)
  // ...
});

export default ChatScreen; 