import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuthContext } from '../context/AuthContext';
import { useEvalApi } from '../services/evalApi';

const EvalScreen = () => {
  const { isAdmin } = useAuthContext();
  const evalApi = useEvalApi();

  const [prompts, setPrompts] = useState<any[]>([]);
  const [personas, setPersonas] = useState<any[]>([]);
  const [selectedPromptIds, setSelectedPromptIds] = useState<string[]>([]);
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>([]);
  const [evalResults, setEvalResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // State for tracking progress
  const [isRunningEval, setIsRunningEval] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalEvalRuns, setTotalEvalRuns] = useState(0);
  const [completedEvalRuns, setCompletedEvalRuns] = useState(0);
  
  // Result filter state
  const [filteredPromptId, setFilteredPromptId] = useState<string | null>(null);
  const [filteredPersonaId, setFilteredPersonaId] = useState<string | null>(null);

  // Load all system prompts and personas on mount
  useEffect(() => {
    fetchPrompts();
    fetchPersonas();
  }, []);

  const fetchPrompts = async () => {
    try {
      const data = await evalApi.getAllSystemPrompts();
      setPrompts(data);
    } catch (err: any) {
      console.error('Error loading prompts', err);
      setError('Failed to load prompts');
    }
  };

  const fetchPersonas = async () => {
    try {
      const data = await evalApi.getPersonas();
      setPersonas(data);
    } catch (err: any) {
      console.error('Error loading personas', err);
      setError('Failed to load personas');
    }
  };

  // Run evaluations for selected prompts and personas
  const runEvaluations = async () => {
    setError(null);
    setIsRunningEval(true);
    setFilteredPromptId(null);
    setFilteredPersonaId(null);
    
    try {
      // Calculate total evaluation runs
      const totalRuns = selectedPromptIds.length * selectedPersonaIds.length;
      setTotalEvalRuns(totalRuns);
      setCompletedEvalRuns(0);
      
      const response = await evalApi.runEval(
        selectedPromptIds, 
        selectedPersonaIds,
        // Progress callback
        (completed) => {
          setCompletedEvalRuns(completed);
          setProgress(completed / totalRuns);
        }
      );
      
      setEvalResults(response.results || []);
    } catch (err: any) {
      console.error('Error running evaluations', err);
      setError('Failed to run evaluations');
    } finally {
      setIsRunningEval(false);
    }
  };

  // Load existing evaluation results
  const loadResults = async () => {
    try {
      const results = await evalApi.getResults();
      setEvalResults(results);
    } catch (err: any) {
      console.error('Error loading evaluation results', err);
      setError('Failed to load evaluation results');
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

  // Toggles a persona ID in the selectedPersonaIds array
  const togglePersonaSelection = (personaId: string) => {
    setSelectedPersonaIds((prev) =>
      prev.includes(personaId)
        ? prev.filter((id) => id !== personaId)
        : [...prev, personaId]
    );
  };
  
  // Filter evaluation results by promptId and/or personaId
  const filterResults = (promptId: string | null, personaId: string | null) => {
    setFilteredPromptId(promptId);
    setFilteredPersonaId(personaId);
  };
  
  // Get the filtered or all results
  const getFilteredResults = () => {
    let filtered = evalResults;
    
    if (filteredPromptId) {
      filtered = filtered.filter(result => result.promptId === filteredPromptId);
    }
    
    if (filteredPersonaId) {
      filtered = filtered.filter(result => result.personaId === filteredPersonaId);
    }
    
    return filtered;
  };
  
  // Get prompt name by ID
  const getPromptNameById = (promptId: string) => {
    const prompt = prompts.find(p => p.id === promptId);
    return prompt ? prompt.name : 'Unknown Prompt';
  };
  
  // Get persona name by ID
  const getPersonaNameById = (personaId: string) => {
    const persona = personas.find(p => p.id === personaId);
    return persona ? persona.name : 'Unknown Persona';
  };

  // Render a score value with appropriate color
  const renderScore = (value: string) => {
    let color = '#666';
    
    if (value === 'high') {
      color = '#4CAF50';
    } else if (value === 'medium') {
      color = '#FF9800';
    } else if (value === 'low') {
      color = '#F44336';
    } else if (value === 'yes') {
      color = '#F44336';
    } else if (value === 'no') {
      color = '#4CAF50';
    }
    
    return (
      <Text style={[styles.scoreValue, { color }]}>
        {value}
      </Text>
    );
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

      {/* Left panel - Evaluation Controls */}
      <View style={styles.leftPanel}>
        <ScrollView style={styles.controlsScrollView}>
          <Text style={styles.sectionTitle}>
            Evaluation Module
          </Text>

          <Text style={styles.subTitle}>
            1) Select System Prompts to Evaluate:
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
                  {p.name} {p.isActive ? '(Active)' : ''} — Model: {p.modelName || 'default'}
                </Text>
              </View>
            );
          })}

          <View style={styles.divider} />

          <Text style={styles.subTitle}>
            2) Select Persona Scenarios to Test:
          </Text>
          {personas.map((p) => {
            const isSelected = selectedPersonaIds.includes(p.id);
            return (
              <View
                key={p.id}
                style={styles.promptRow}
              >
                <Button
                  title={isSelected ? 'Deselect' : 'Select'}
                  onPress={() => togglePersonaSelection(p.id)}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.promptText}>{p.name}</Text>
                  <Text style={styles.promptDescription}>{p.description}</Text>
                </View>
              </View>
            );
          })}

          <View style={styles.divider} />

          <Button
            title="Run Evaluations"
            onPress={runEvaluations}
            disabled={selectedPromptIds.length === 0 || selectedPersonaIds.length === 0 || isRunningEval}
          />
          
          <View style={{ marginTop: 8 }} />
          
          <Button
            title="Load Existing Results"
            onPress={loadResults}
            disabled={isRunningEval}
          />
          
          {/* Progress indicator */}
          {isRunningEval && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressTitle}>Running Evaluations...</Text>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${Math.min(progress * 100, 100)}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {completedEvalRuns} of {totalEvalRuns} evaluations completed
                ({Math.round(progress * 100)}%)
              </Text>
              <ActivityIndicator style={styles.progressSpinner} />
            </View>
          )}
        </ScrollView>
      </View>

      {/* Right panel - Evaluation Results */}
      <View style={styles.rightPanel}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            Evaluation Results:
          </Text>
          
          {/* Filter controls */}
          {evalResults.length > 0 && (
            <View style={styles.filterControls}>
              <Text style={styles.filterLabel}>Filter by prompt:</Text>
              <TouchableOpacity 
                style={[styles.filterButton, !filteredPromptId && styles.activeFilterButton]}
                onPress={() => filterResults(null, filteredPersonaId)}
              >
                <Text style={[styles.filterButtonText, !filteredPromptId && styles.activeFilterText]}>
                  All Prompts
                </Text>
              </TouchableOpacity>
              
              {/* Create a unique list of prompt IDs from evalResults */}
              {Array.from(new Set(evalResults.map(r => r.promptId))).map(promptId => (
                <TouchableOpacity 
                  key={`prompt-${promptId}`}
                  style={[
                    styles.filterButton, 
                    filteredPromptId === promptId && styles.activeFilterButton
                  ]}
                  onPress={() => filterResults(promptId as string, filteredPersonaId)}
                >
                  <Text style={[
                    styles.filterButtonText, 
                    filteredPromptId === promptId && styles.activeFilterText
                  ]}>
                    {getPromptNameById(promptId as string)}
                  </Text>
                </TouchableOpacity>
              ))}
              
              <View style={styles.filterDivider} />
              
              <Text style={styles.filterLabel}>Filter by persona:</Text>
              <TouchableOpacity 
                style={[styles.filterButton, !filteredPersonaId && styles.activeFilterButton]}
                onPress={() => filterResults(filteredPromptId, null)}
              >
                <Text style={[styles.filterButtonText, !filteredPersonaId && styles.activeFilterText]}>
                  All Personas
                </Text>
              </TouchableOpacity>
              
              {/* Create a unique list of persona IDs from evalResults */}
              {Array.from(new Set(evalResults.map(r => r.personaId))).map(personaId => (
                <TouchableOpacity 
                  key={`persona-${personaId}`}
                  style={[
                    styles.filterButton, 
                    filteredPersonaId === personaId && styles.activeFilterButton
                  ]}
                  onPress={() => filterResults(filteredPromptId, personaId as string)}
                >
                  <Text style={[
                    styles.filterButtonText, 
                    filteredPersonaId === personaId && styles.activeFilterText
                  ]}>
                    {getPersonaNameById(personaId as string)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        
        <ScrollView style={styles.resultsScrollView}>
          {getFilteredResults().map((result, i) => (
            <View
              key={`${result.id || `${result.promptId}-${result.personaId}-${i}`}`}
              style={styles.resultCard}
            >
              <View style={styles.resultHeader}>
                <Text style={styles.resultPromptName}>
                  Prompt: {getPromptNameById(result.promptId)} (ID: {result.promptId?.substring(0, 8)})
                </Text>
                <Text style={styles.resultPersonaName}>
                  Persona: {result.persona?.name || getPersonaNameById(result.personaId)} 
                  (ID: {result.personaId?.substring(0, 8)})
                </Text>
                <Text style={styles.resultDate}>
                  Date: {new Date(result.createdAt).toLocaleString()}
                </Text>
              </View>
              
              {/* Scores Section */}
              {result.scores && (
                <View style={styles.scoresContainer}>
                  {/* Overall Assessment */}
                  {result.scores.overallAssessment && (
                    <View style={styles.overallAssessment}>
                      <Text style={styles.overallAssessmentTitle}>Overall Assessment:</Text>
                      <Text style={styles.overallAssessmentText}>{result.scores.overallAssessment}</Text>
                    </View>
                  )}
                  
                  {/* Engagement Section */}
                  {result.scores.engagement && (
                    <View style={styles.scoreSection}>
                      <Text style={styles.scoreSectionTitle}>Engagement & Interaction Quality</Text>
                      <View style={styles.scoreGrid}>
                        {Object.entries(result.scores.engagement).map(([key, value]) => (
                          <View key={key} style={styles.scoreItem}>
                            <Text style={styles.scoreLabel}>
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                            </Text>
                            {renderScore(value as string)}
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                  
                  {/* Emotional Intelligence Section */}
                  {result.scores.emotionalIntelligence && (
                    <View style={styles.scoreSection}>
                      <Text style={styles.scoreSectionTitle}>Emotional Intelligence & Relational Depth</Text>
                      <View style={styles.scoreGrid}>
                        {Object.entries(result.scores.emotionalIntelligence).map(([key, value]) => (
                          <View key={key} style={styles.scoreItem}>
                            <Text style={styles.scoreLabel}>
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                            </Text>
                            {renderScore(value as string)}
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                  
                  {/* Insights & Advice Section */}
                  {result.scores.insightsAndAdvice && (
                    <View style={styles.scoreSection}>
                      <Text style={styles.scoreSectionTitle}>Insights & Advice Quality</Text>
                      <View style={styles.scoreGrid}>
                        {Object.entries(result.scores.insightsAndAdvice).map(([key, value]) => (
                          <View key={key} style={styles.scoreItem}>
                            <Text style={styles.scoreLabel}>
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                            </Text>
                            {renderScore(value as string)}
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                  
                  {/* Failures & Safety Section */}
                  {result.scores.failuresAndSafety && (
                    <View style={styles.scoreSection}>
                      <Text style={styles.scoreSectionTitle}>Failures & Safety</Text>
                      <View style={styles.scoreGrid}>
                        {Object.entries(result.scores.failuresAndSafety).map(([key, value]) => (
                          <View key={key} style={styles.scoreItem}>
                            <Text style={styles.scoreLabel}>
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                            </Text>
                            {renderScore(value as string)}
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}
              
              {/* Conversation Preview Button */}
              <TouchableOpacity 
                style={styles.conversationButton}
                onPress={() => {
                  // Show the conversation in an alert for now
                  // In a production app, you would show this in a proper modal dialog
                  if (result.conversation) {
                    // Format the conversation for display
                    const transcript = result.conversation
                      .filter((msg: any) => msg.role !== 'system')
                      .map((msg: any) => `${msg.role.toUpperCase()}: ${msg.content}`)
                      .join('\n\n');
                    
                    alert(`CONVERSATION TRANSCRIPT:\n\n${transcript}`);
                  } else {
                    alert('No conversation transcript available');
                  }
                }}
              >
                <Text style={styles.conversationButtonText}>View Conversation Transcript</Text>
              </TouchableOpacity>
            </View>
          ))}
          
          {evalResults.length > 0 && getFilteredResults().length === 0 && (
            <Text style={styles.noResultsText}>
              No results match the current filter.
            </Text>
          )}
          
          {evalResults.length === 0 && (
            <Text style={styles.noResultsText}>
              No evaluation results available. Run an evaluation or load existing results.
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
    flex: 1.5,
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
    marginBottom: 12,
  },
  promptText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  promptDescription: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  divider: {
    height: 1, 
    backgroundColor: '#ccc', 
    marginVertical: 16,
  },
  resultCard: {
    padding: 16,
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
  resultPersonaName: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  resultDate: {
    color: '#555',
    fontSize: 12,
    marginTop: 4,
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
  filterDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  noResultsText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
    fontStyle: 'italic',
  },
  scoresContainer: {
    marginTop: 12,
  },
  overallAssessment: {
    marginBottom: 16,
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  overallAssessmentTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  overallAssessmentText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  scoreSection: {
    marginBottom: 16,
  },
  scoreSectionTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    padding: 6,
    borderRadius: 4,
  },
  scoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  scoreItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '50%',
    paddingRight: 16,
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  conversationButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  conversationButtonText: {
    color: '#333',
    fontWeight: '500',
  },
});

export default EvalScreen;