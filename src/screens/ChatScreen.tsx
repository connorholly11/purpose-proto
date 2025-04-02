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
  modelName?: string;    // <-- ADDED to handle which model is used
  createdAt: string;
  updatedAt: string;
};

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

  // Local state
  const [inputText, setInputText] = useState('');
  const [debugExpanded, setDebugExpanded] = useState(false);
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [isDebugEnabled, setIsDebugEnabled] = useState(false);

  // Add states for active prompt & model
  const [activePromptName, setActivePromptName] = useState<string>('Loading...');
  const [activeModelName, setActiveModelName] = useState<string>('(Unknown)');

  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  // API instance
  const api = useApi();
  
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

      // Find the default active prompt & update the active prompt name + model
      const activePrompt = prompts.find((p: SystemPrompt) => p.isActive);
      if (activePrompt) {
        setActivePromptName(activePrompt.name);
        setActiveModelName(activePrompt.modelName || 'gpt-4o');
      } else {
        setActivePromptName('Default (None Active!)');
        setActiveModelName('gpt-4o');
      }
    } catch (err) {
      console.error('Failed to load system prompts:', err);
      setActivePromptName('Error loading prompts');
      setActiveModelName('(Error)');
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
          selectedPromptId || undefined, 
          isDebugEnabled
        );
      } catch (err) {
        // Error is handled within the context, but you could add extra UI feedback if needed
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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar style="auto" />
      
      {/* Active Prompt & Model Display */}
      <View style={styles.activePromptContainer}>
        <Text style={styles.activePromptLabel}>Active Prompt:</Text>
        <Text style={styles.activePromptValue}>{activePromptName}</Text>

        <Text style={styles.activePromptLabel}>Active Model:</Text>
        <Text style={styles.activePromptValue}>{activeModelName}</Text>
      </View>
      
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
                      mode="outlined"
                    >
                      Default (Active)
                    </Chip>
                    
                    {systemPrompts.map(prompt => (
                      <Chip
                        key={prompt.id}
                        selected={selectedPromptId === prompt.id}
                        onPress={() => setSelectedPromptId(prompt.id)}
                        style={styles.promptChip}
                        mode="outlined"
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
                <Checkbox.Android
                  status={isDebugEnabled ? 'checked' : 'unchecked'}
                  onPress={() => setIsDebugEnabled(!isDebugEnabled)}
                />
              </View>
            </View>
            
            {isDebugEnabled && debugInfo && (
              <View style={styles.debugInfoContainer}>
                <Divider style={styles.divider} />
                <Text style={styles.debugInfoTitle}>Last Message Debug Info:</Text>
                <Text style={styles.debugInfoTime}>
                  Timestamp: {formatDate(debugInfo.timestamp)}
                </Text>
                
                <List.Accordion
                  title="Prompt Used"
                  id="prompt-accordion"
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
                  id="memory-accordion"
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
          onSubmitEditing={handleSend}
          disabled={loading}
          right={loading ? <TextInput.Icon icon="loading" size={20} /> : null}
        />
        <Button 
          mode="contained" 
          onPress={handleSend} 
          style={styles.sendButton}
          disabled={!inputText.trim() || loading}
        >
          Send
        </Button>
      </View>
      
      {/* Optional loading overlay
      {loading && (
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
    marginBottom: 4,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
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
    paddingHorizontal: 0,
    marginBottom: 8,
  },
  promptChips: {
    flexDirection: 'row',
    paddingBottom: 4,
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
    paddingHorizontal: 0,
    minHeight: 40,
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
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: '#f9f9f9',
    minHeight: 40,
  },
  debugAccordionTitle: {
    fontSize: 14,
  },
  debugInfoContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
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
    paddingTop: 8,
    paddingBottom: 8,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '85%',
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: MD3Colors.primary80,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#000000',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    paddingBottom: Platform.OS === 'ios' ? 8 : 12,
    backgroundColor: '#ffffff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#dddddd',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    marginRight: 8,
    maxHeight: 100,
    backgroundColor: '#ffffff',
  },
  sendButton: {
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 0 : 4,
  },
  errorContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    backgroundColor: '#ffcccc',
    borderRadius: 8,
  },
  errorText: {
    color: '#d32f2f',
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
    elevation: 4,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  activePromptContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#dddddd',
  },
  activePromptLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  activePromptValue: {
    fontSize: 14,
    marginRight: 16, // Extra spacing so the next label doesn't butt up against it
  },
});

export default ChatScreen;
