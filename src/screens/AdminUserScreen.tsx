import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { Button } from 'react-native-paper';
import { useApi } from '../hooks/useApi';

// Type definitions
type User = {
  id: string;
  clerkId: string;
  username?: string;
  email?: string;
  createdAt: string;
};

type Message = {
  id: string;
  userId: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: string;
};

// Define the expected structure of summaryData based on backend changes
interface UserContextData {
  // Core understanding of the user
  core_understanding: {
    personality: string;        // Natural description of user's personality
    current_journey: string;    // What they're focused on/going through
    communication_style: string // How they interact and communicate
  };
  
  // How our relationship/understanding evolves
  relationship_patterns: {
    interaction_style: string;  // How we work together
    trust_development: string;  // How our rapport has developed
    engagement_patterns: string // What drives meaningful interactions
  };
  
  // Dynamic learning about the user
  evolving_insights: {
    recent_observations: string[];     // New patterns or understanding
    consistent_patterns: string[];     // Stable traits/preferences
    changing_patterns: string[];       // How they're evolving
  };

  // Technical necessities
  latest_interactions: string[];      // Recent messages for immediate context
  last_update: string;               // When understanding was last deepened
}

type StructuredSummary = {
  id: string;
  userId: string;
  summaryData: UserContextData | null;
  createdAt: string;
  updatedAt: string;
};

const AdminUserScreen = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userHistory, setUserHistory] = useState<Message[]>([]);
  const [userSummary, setUserSummary] = useState<StructuredSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // API instance
  const api = useApi();
  
  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);
  
  // Load all users
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedUsers = await api.admin.getUsers();
      setUsers(fetchedUsers);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Load user details when a user is selected
  const handleUserSelect = async (user: User) => {
    if (selectedUser?.id === user.id && !loadingDetails) return;

    setSelectedUser(user);
    setLoadingDetails(true);
    setError(null);
    setUserHistory([]);
    setUserSummary(null);

    try {
      // Fetch History
      let history: Message[] = [];
      try {
        history = await api.admin.getUserHistory(user.clerkId);
        setUserHistory(history);
      } catch (historyError) {
        console.error(`Failed to load history for user ${user.clerkId}:`, historyError);
        setError('Failed to load user conversation history.');
      }

      // Fetch Summary (Context)
      try {
        const summary = await api.admin.getUserSummary(user.clerkId);
        setUserSummary(summary);
      } catch (err: any) {
        if (!(err.response?.status === 404)) {
          setError('An unexpected error occurred while loading user details.');
          console.error('Error in handleUserSelect (non-404 summary error):', err);
        } else {
          console.log(`No summary found for user ${user.clerkId} (404)`);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred while loading user details.');
      console.error('Error in handleUserSelect:', err);
    } finally {
      setLoadingDetails(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleString();
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return 'Invalid Date';
    }
  };
  
  // Render a user item in the user list
  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[
        styles.userItem,
        selectedUser?.id === item.id && styles.selectedUserItem,
      ]}
      onPress={() => handleUserSelect(item)}
    >
      <Text style={styles.userName}>
        {item.email || item.username || item.clerkId.substring(5)}
      </Text>
      <Text style={styles.userDate}>Joined: {formatDate(item.createdAt)}</Text>
    </TouchableOpacity>
  );
  
  // Render a message item in the conversation history
  const renderMessageItem = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageItem,
      item.role === 'user' ? styles.userMessage : styles.assistantMessage
    ]}>
      <View style={styles.messageHeader}>
        <Text style={styles.messageRole}>{item.role}</Text>
        <Text style={styles.messageTime}>{formatDate(item.createdAt)}</Text>
      </View>
      <Text style={styles.messageContent}>{item.content}</Text>
    </View>
  );
  
  // Helper to render context sections
  const renderContextSection = (title: string, data: string[] | undefined) => {
    if (!data || data.length === 0) return null;
    return (
      <>
        <Text style={styles.summarySectionTitle}>{title}:</Text>
        {data.map((item, index) => (
          <Text key={`${title}-${index}`} style={styles.summaryItem}>- {item}</Text>
        ))}
      </>
    );
  };

  // Helper to render conversation summaries (if we had them in old format)
  const renderConversationSummaries = (summaries: Record<string, string> | undefined) => {
    if (!summaries || Object.keys(summaries).length === 0) return null;

    // Sort keys numerically
    const sortedKeys = Object.keys(summaries)
      .filter(key => key.startsWith('conversation_'))
      .sort((a, b) => parseInt(a.split('_')[1]) - parseInt(b.split('_')[1]));

    return (
      <>
        <Text style={styles.summarySectionTitle}>Conversation Summaries (Last 10):</Text>
        {sortedKeys.slice(-10).map(key => (
          <Text key={key} style={styles.summaryItem}>
            <Text style={styles.summaryConvKey}>{key.replace('_', ' ')}:</Text> {summaries[key]}
          </Text>
        ))}
      </>
    );
  };

  const handleGenerateSummary = async () => {
    if (!selectedUser || loadingDetails) return;
    
    try {
      setLoadingDetails(true);
      setError(null);
      console.log(`Triggering manual context update for ${selectedUser.clerkId}`);
      await api.admin.generateUserSummary(selectedUser.clerkId);
      // After generating, reload
      console.log(`Context update complete for ${selectedUser.clerkId}, reloading details...`);
      await handleUserSelect(selectedUser);
    } catch (err: any) {
      if (err.response?.status === 500) {
        console.error('Server error when generating summary:', err);
        setError('Server error (500) when generating summary. The backend may be unavailable.');
      } else {
        setError('Failed to update context summary');
        console.error('Error triggering manual context update:', err);
      }
      setLoadingDetails(false);
    }
  };
  
  // Helper to render the new or old user context
  const renderNaturalUserContext = (contextData: UserContextData | null) => {
    if (!contextData) return null;
    
    // OLD FORMAT MIGRATION:
    if (!('core_understanding' in contextData) && ('preferences' in contextData as any)) {
      const oldContext = contextData as any;
      return (
        <>
          {renderContextSection("Preferences", oldContext.preferences)}
          {renderContextSection("Facts", oldContext.facts)}
          {renderContextSection("Latest Chat", oldContext.latest_chat)}
          {renderConversationSummaries(oldContext.conversation_summaries)}
          <Text style={styles.summaryLabel}>
            Note: Context is in legacy format and will be migrated on next update
          </Text>
        </>
      );
    }
    
    // NEW FORMAT
    const coreUnderstanding = contextData.core_understanding || {};
    const relationshipPatterns = contextData.relationship_patterns || {};
    const evolvingInsights = contextData.evolving_insights || { 
      recent_observations: [], 
      consistent_patterns: [], 
      changing_patterns: [] 
    };
    
    return (
      <>
        <Text style={styles.summarySectionTitle}>Core Understanding</Text>
        {coreUnderstanding.personality && (
          <Text style={styles.summaryItem}>Personality: {coreUnderstanding.personality}</Text>
        )}
        {coreUnderstanding.current_journey && (
          <Text style={styles.summaryItem}>Current Journey: {coreUnderstanding.current_journey}</Text>
        )}
        {coreUnderstanding.communication_style && (
          <Text style={styles.summaryItem}>Communication Style: {coreUnderstanding.communication_style}</Text>
        )}

        <Text style={styles.summarySectionTitle}>Relationship Patterns</Text>
        {relationshipPatterns.interaction_style && (
          <Text style={styles.summaryItem}>Interaction Style: {relationshipPatterns.interaction_style}</Text>
        )}
        {relationshipPatterns.trust_development && (
          <Text style={styles.summaryItem}>Trust Development: {relationshipPatterns.trust_development}</Text>
        )}
        {relationshipPatterns.engagement_patterns && (
          <Text style={styles.summaryItem}>Engagement Patterns: {relationshipPatterns.engagement_patterns}</Text>
        )}

        <Text style={styles.summarySectionTitle}>Evolving Insights</Text>
        {evolvingInsights.recent_observations?.length > 0 && (
          <>
            <Text style={styles.summarySubsectionTitle}>Recent Observations:</Text>
            {evolvingInsights.recent_observations.map((obs, i) => (
              <Text key={`obs-${i}`} style={styles.summaryItem}>• {obs}</Text>
            ))}
          </>
        )}
        {evolvingInsights.consistent_patterns?.length > 0 && (
          <>
            <Text style={styles.summarySubsectionTitle}>Consistent Patterns:</Text>
            {evolvingInsights.consistent_patterns.map((pat, i) => (
              <Text key={`pat-${i}`} style={styles.summaryItem}>• {pat}</Text>
            ))}
          </>
        )}
        {evolvingInsights.changing_patterns?.length > 0 && (
          <>
            <Text style={styles.summarySubsectionTitle}>Changing Patterns:</Text>
            {evolvingInsights.changing_patterns.map((chg, i) => (
              <Text key={`chg-${i}`} style={styles.summaryItem}>• {chg}</Text>
            ))}
          </>
        )}

        {contextData.latest_interactions && contextData.latest_interactions.length > 0 && (
          <>
            <Text style={styles.summarySectionTitle}>Recent Exchanges</Text>
            {contextData.latest_interactions.map((msg, index) => (
              <Text key={`latest-${index}`} style={styles.summaryLatestMsg}>
                "{msg}"
              </Text>
            ))}
          </>
        )}
        
        {contextData.last_update && (
          <Text style={styles.summaryUpdateTime}>
            Last updated: {formatDate(contextData.last_update)}
          </Text>
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>User Inspector</Text>
      </View>
      
      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.content}>
        {/* User list */}
        <View style={styles.userList}>
          <Text style={styles.sectionTitle}>Users ({users.length})</Text>
          {loading ? (
            <ActivityIndicator size="large" style={styles.loader} />
          ) : (
            <FlatList
              data={users}
              keyExtractor={item => item.id}
              renderItem={renderUserItem}
              contentContainerStyle={styles.list}
            />
          )}
        </View>
        
        {/* User details */}
        <View style={styles.userDetails}>
          {selectedUser ? (
            <>
              <View style={styles.detailsHeader}>
                <Text style={styles.detailsTitle}>
                  Details for {selectedUser.email || selectedUser.username || selectedUser.clerkId.substring(5)}
                </Text>
                <Button
                  mode="contained"
                  onPress={handleGenerateSummary}
                  style={styles.generateButton}
                  disabled={loadingDetails}
                  loading={loadingDetails && !userHistory.length}
                  compact
                >
                  Update Context
                </Button>
              </View>

              {loadingDetails ? (
                <ActivityIndicator size="large" style={styles.loader} />
              ) : (
                <ScrollView style={styles.detailsContent}>
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>User Context</Text>
                    <Text style={styles.summaryLabel}>
                      Natural understanding of the user based on conversation history
                    </Text>
                    {userSummary ? (
                      <View style={styles.summaryContainer}>
                        <View style={styles.summaryHeader}>
                          <Text style={styles.sectionTitle}>User Context</Text>
                        </View>

                        {renderNaturalUserContext(userSummary.summaryData)}
                      </View>
                    ) : (
                      <Text style={styles.emptyText}>
                        No context summary data available for this user.
                      </Text>
                    )}
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                      Conversation History ({userHistory.length} messages)
                    </Text>
                    {userHistory.length > 0 ? (
                      <FlatList
                        data={userHistory}
                        keyExtractor={item => item.id}
                        renderItem={renderMessageItem}
                        scrollEnabled={false}
                      />
                    ) : (
                      <Text style={styles.emptyText}>
                        No conversation history found.
                      </Text>
                    )}
                  </View>
                </ScrollView>
              )}
            </>
          ) : (
            !loading && (
              <Text style={styles.selectPrompt}>
                Please select a user from the list
              </Text>
            )
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  userList: {
    width: Platform.OS === 'web' ? '25%' : '35%',
    borderRightWidth: 1,
    borderRightColor: '#dee2e6',
    paddingRight: 16,
  },
  userDetails: {
    flex: 1,
    paddingLeft: 16,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  list: {
    paddingBottom: 20,
  },
  userItem: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease',
        }
      : {}),
  },
  selectedUserItem: {
    backgroundColor: '#e0f3ff',
    borderColor: '#99d6ff',
  },
  userName: {
    fontWeight: '500',
    fontSize: 14,
  },
  userDate: {
    fontSize: 11,
    color: '#6c757d',
    marginTop: 2,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailsContent: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#343a40',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingBottom: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 16,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }
      : {}),
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 16,
  },
  summarySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginTop: 14,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingBottom: 4,
  },
  summarySubsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginTop: 8,
    marginBottom: 4,
    marginLeft: 4,
  },
  summaryItem: {
    fontSize: 13,
    marginLeft: 10,
    marginBottom: 6,
    lineHeight: 18,
  },
  summaryConvKey: {
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  summaryLatestMsg: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 5,
    marginLeft: 10,
    fontStyle: 'italic',
  },
  summaryUpdateTime: {
    fontSize: 10,
    color: '#adb5bd',
    marginTop: 12,
    textAlign: 'right',
  },
  emptyText: {
    fontStyle: 'italic',
    color: '#6c757d',
    marginTop: 8,
    fontSize: 14,
  },
  selectPrompt: {
    fontStyle: 'italic',
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 40,
  },
  loader: {
    marginVertical: 20,
    alignSelf: 'center',
  },
  error: {
    color: '#dc3545',
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
    textAlign: 'center',
  },
  generateButton: {
    backgroundColor: '#e7f5ff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#a5d8ff',
  },
  messageItem: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    maxWidth: '90%',
  },
  userMessage: {
    backgroundColor: '#e9ecef',
    alignSelf: 'flex-end',
    marginLeft: '10%',
  },
  assistantMessage: {
    backgroundColor: '#f1f8ff',
    alignSelf: 'flex-start',
    marginRight: '10%',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  messageRole: {
    fontSize: 11,
    color: '#6c757d',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  messageTime: {
    fontSize: 10,
    color: '#adb5bd',
  },
  messageContent: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default AdminUserScreen;
