import React, { useState, useEffect } from 'react';
import { View, Text, Button, TextInput, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuthContext } from '../context/AuthContext';
import { useTestingApi } from '../services/testingApi';

const TestingScreen = () => {
  const { isAdmin } = useAuthContext();
  const testingApi = useTestingApi();

  const [prompts, setPrompts] = useState<any[]>([]);
  const [selectedPromptIds, setSelectedPromptIds] = useState<string[]>([]);

  // We'll store custom messages as multiline text
  const [customMessages, setCustomMessages] = useState('');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // New state for tracking progress
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalApiCalls, setTotalApiCalls] = useState(0);
  const [completedApiCalls, setCompletedApiCalls] = useState(0);
  
  // Result filter state
  const [filteredPromptId, setFilteredPromptId] = useState<string | null>(null);

  // Load all system prompts on mount
  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const data = await testingApi.getAllSystemPrompts();
      setPrompts(data);
    } catch (err: any) {
      console.error('Error loading prompts', err);
      setError('Failed to load prompts');
    }
  };

  // Convert each line in `customMessages` into {role: 'user', content: line}
  const parseMessages = (input: string) => {
    return input
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((content) => ({ role: 'user' as const, content }));
  };

  // Single-sequence test
  const runSingleSequenceTest = async () => {
    setError(null);
    setIsRunningTest(true);
    setFilteredPromptId(null); // Reset filter when starting a new test
    
    try {
      const userMessages = parseMessages(customMessages);
      // Calculate total API calls (one per message per prompt)
      const totalCalls = selectedPromptIds.length * userMessages.length;
      setTotalApiCalls(totalCalls);
      setCompletedApiCalls(0);
      
      const response = await testingApi.runSequence(
        selectedPromptIds, 
        userMessages,
        // Progress callback
        (completed) => {
          setCompletedApiCalls(completed);
          setProgress(completed / totalCalls);
        }
      );
      
      setTestResults(response.results || []);
    } catch (err: any) {
      console.error('Error running single sequence test', err);
      setError('Failed to run single sequence test');
    } finally {
      setIsRunningTest(false);
    }
  };

  // 4x4x4 protocol test
  const runProtocolTest = async () => {
    setError(null);
    setIsRunningTest(true);
    setFilteredPromptId(null); // Reset filter when starting a new test
    
    try {
      // For 4x4x4, we know there are 12 messages per prompt (4+4+4)
      const totalCalls = selectedPromptIds.length * 12;
      setTotalApiCalls(totalCalls);
      setCompletedApiCalls(0);
      
      const response = await testingApi.runProtocol(
        selectedPromptIds, 
        '4x4x4',
        // Progress callback
        (completed) => {
          setCompletedApiCalls(completed);
          setProgress(completed / totalCalls);
        }
      );
      
      setTestResults(response.results || []);
    } catch (err: any) {
      console.error('Error running 4x4x4 protocol test', err);
      setError('Failed to run 4x4x4 protocol test');
    } finally {
      setIsRunningTest(false);
    }
  };

  // Toggles a prompt ID in the selectedPromptIds array
  const togglePromptSelection = (promptId: string) => {
    setSelectedPromptIds((prev) =>
      prev.includes(promptId)
        ? prev.filter((id) => id !== promptId)
        : [...prev, promptId]
    );
  };
  
  // Filter test results by promptId
  const filterResults = (promptId: string | null) => {
    setFilteredPromptId(promptId);
  };
  
  // Get the filtered or all results
  const getFilteredResults = () => {
    if (!filteredPromptId) return testResults;
    return testResults.filter(result => result.promptId === filteredPromptId);
  };
  
  // Get prompt name by ID
  const getPromptNameById = (promptId: string) => {
    const prompt = prompts.find(p => p.id === promptId);
    return prompt ? prompt.name : 'Unknown Prompt';
  };

  if (!isAdmin) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Forbidden - Admins Only</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* Left panel - Testing Controls */}
      <View style={styles.leftPanel}>
        <ScrollView style={styles.controlsScrollView}>
          <Text style={styles.sectionTitle}>
            Testing Module
          </Text>

          <Text style={styles.subTitle}>
            1) Select System Prompts to Test:
          </Text>
          {prompts.map((p) => {
            const isSelected = selectedPromptIds.includes(p.id);
            return (
              <View
                key={p.id}
                style={styles.promptRow}
              >
                <Button
                  title={isSelected ? 'Deselect' : 'Select'}
                  onPress={() => togglePromptSelection(p.id)}
                />
                <Text style={styles.promptText}>
                  {p.name} {p.isActive ? '(Active)' : ''} — Model: {p.modelName || 'gpt-4o'}
                </Text>
              </View>
            );
          })}

          <View style={styles.divider} />

          <Text style={styles.subTitle}>
            2) Provide Custom User Messages (one per line):
          </Text>
          <TextInput
            multiline
            numberOfLines={6}
            style={styles.textInput}
            placeholder="Type each message on a new line..."
            value={customMessages}
            onChangeText={setCustomMessages}
          />

          <Button
            title="Run Single Sequence Test"
            onPress={runSingleSequenceTest}
            disabled={selectedPromptIds.length === 0 || isRunningTest}
          />

          <View style={styles.divider} />

          <Text style={styles.subTitle}>
            3) Or Run 4x4x4 Protocol
          </Text>
          <Text style={styles.protocolDescription}>
            Runs a continuous conversation with 12 sequential messages in 3 phases: 
            4 opening prompts, 4 follow-up challenges, and 4 tone tests.
          </Text>
          <Button
            title="Run 4x4x4 Protocol"
            onPress={runProtocolTest}
            disabled={selectedPromptIds.length === 0 || isRunningTest}
          />
          
          {/* Progress indicator */}
          {isRunningTest && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressTitle}>Running Test...</Text>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${Math.min(progress * 100, 100)}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {completedApiCalls} of {totalApiCalls} API calls completed
                ({Math.round(progress * 100)}%)
              </Text>
              <ActivityIndicator style={styles.progressSpinner} />
            </View>
          )}
        </ScrollView>
      </View>

      {/* Right panel - Test Results */}
      <View style={styles.rightPanel}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            Test Results:
          </Text>
          
          {/* Filter controls */}
          {testResults.length > 0 && (
            <View style={styles.filterControls}>
              <Text style={styles.filterLabel}>Filter by prompt:</Text>
              <TouchableOpacity 
                style={[styles.filterButton, !filteredPromptId && styles.activeFilterButton]}
                onPress={() => filterResults(null)}
              >
                <Text style={[styles.filterButtonText, !filteredPromptId && styles.activeFilterText]}>
                  Show All
                </Text>
              </TouchableOpacity>
              
              {testResults.map(result => (
                <TouchableOpacity 
                  key={result.promptId}
                  style={[
                    styles.filterButton, 
                    filteredPromptId === result.promptId && styles.activeFilterButton
                  ]}
                  onPress={() => filterResults(result.promptId)}
                >
                  <Text style={[
                    styles.filterButtonText, 
                    filteredPromptId === result.promptId && styles.activeFilterText
                  ]}>
                    {result.promptName || getPromptNameById(result.promptId)}
                    {result.hasErrors && ' ⚠️'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        
        <ScrollView style={styles.resultsScrollView}>
          {getFilteredResults().map((result, i) => (
            <View
              key={`${result.promptId}-${i}`}
              style={styles.resultCard}
            >
              <View style={styles.resultHeader}>
                <Text style={styles.resultPromptName}>
                  Prompt: {result.promptName} (ID: {result.promptId})
                </Text>
                <Text style={styles.resultModelName}>Model: {result.modelName}</Text>
                
                {result.hasErrors && (
                  <View style={styles.errorBadge}>
                    <Text style={styles.errorBadgeText}>
                      Contains Failed API Calls
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.exchangesContainer}>
                {result.exchanges?.map((ex: any, idx: number) => {
                  const isError = ex.error === true;
                  return (
                    <View 
                      key={idx} 
                      style={[
                        styles.exchangeRow,
                        ex.role === 'user' ? styles.userExchange : styles.aiExchange,
                        isError && styles.errorExchange
                      ]}
                    >
                      <View style={styles.exchangeHeader}>
                        <Text style={styles.exchangeRole}>[{ex.role}]</Text>
                        {isError && (
                          <Text style={styles.errorIndicator}>API CALL FAILED</Text>
                        )}
                      </View>
                      <Text style={[
                        styles.exchangeText,
                        isError && styles.errorExchangeText
                      ]}>
                        {ex.content}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
          
          {testResults.length > 0 && getFilteredResults().length === 0 && (
            <Text style={styles.noResultsText}>
              No results match the current filter.
            </Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'red',
    zIndex: 1,
  },
  leftPanel: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  rightPanel: {
    flex: 1,
  },
  controlsScrollView: {
    padding: 16,
  },
  resultsScrollView: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 16,
  },
  subTitle: {
    fontWeight: '600', 
    marginBottom: 8,
  },
  protocolDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  resultsHeader: {
    padding: 16,
    paddingBottom: 0,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  promptText: {
    marginLeft: 8,
    flex: 1,
  },
  divider: {
    height: 1, 
    backgroundColor: '#ccc', 
    marginVertical: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 16,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  resultCard: {
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  resultHeader: {
    marginBottom: 12,
  },
  resultPromptName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultModelName: {
    color: '#555',
  },
  errorBadge: {
    backgroundColor: '#ffeeee',
    borderWidth: 1,
    borderColor: '#ffcccc',
    borderRadius: 4,
    padding: 4,
    marginTop: 8,
  },
  errorBadgeText: {
    color: '#cc0000',
    fontSize: 12,
    fontWeight: '500',
  },
  exchangesContainer: {
    marginTop: 8,
  },
  exchangeRow: {
    marginBottom: 10,
    padding: 8,
    borderRadius: 8,
  },
  exchangeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userExchange: {
    backgroundColor: '#f0f0f0',
  },
  aiExchange: {
    backgroundColor: '#e6f7ff',
  },
  errorExchange: {
    backgroundColor: '#fff0f0',
    borderWidth: 1,
    borderColor: '#ffcccc',
  },
  exchangeRole: {
    fontWeight: 'bold',
  },
  errorIndicator: {
    color: '#cc0000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  exchangeText: {
    lineHeight: 20,
  },
  errorExchangeText: {
    color: '#cc0000',
    fontStyle: 'italic',
  },
  progressContainer: {
    marginTop: 16,
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  progressTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 8,
  },
  progressSpinner: {
    marginTop: 4,
  },
  filterControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterLabel: {
    marginRight: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeFilterButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#388E3C',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#444',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  noResultsText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
    fontStyle: 'italic',
  }
});

export default TestingScreen;
