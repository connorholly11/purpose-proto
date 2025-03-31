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

type StructuredSummary = {
  id: string;
  userId: string;
  summaryData: any;
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
    if (selectedUser?.id === user.id) return;

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

      // Fetch Summary
      const summary = await api.admin.getUserSummary(user.clerkId);
      setUserSummary(summary);
    } catch (err) {
      setError('An unexpected error occurred while loading user details.');
      console.error('Error in handleUserSelect (likely non-404 summary error):', err);
      setUserHistory([]);
      setUserSummary(null);
    } finally {
      setLoadingDetails(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      const date = new Date(dateString);
      return date.toLocaleString();
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
        {item.email || item.username || item.clerkId.substring(0, 12) + '...'}
      </Text>
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
  
  const handleGenerateSummary = async () => {
    if (!selectedUser) return;
    
    try {
      setLoadingDetails(true);
      setError(null);
      await api.admin.generateUserSummary(selectedUser.clerkId);
      // After generating summary, reload the user details
      await handleUserSelect(selectedUser);
    } catch (err) {
      setError('Failed to generate summary');
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
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
          <Text style={styles.sectionTitle}>Users</Text>
          
          {loading && (
            <ActivityIndicator size="large" style={styles.loader} />
          )}
          
          {!loading && (
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
              <Text style={styles.detailsTitle}>
                Details for {selectedUser.username || selectedUser.clerkId}
              </Text>
              
              <Button 
                mode="contained" 
                onPress={handleGenerateSummary}
                style={styles.generateButton}
                disabled={loadingDetails}
              >
                Generate/Update Summary
              </Button>
              
              {loadingDetails ? (
                <ActivityIndicator size="large" style={styles.loader} />
              ) : (
                <ScrollView style={styles.detailsContent}>
                  {/* Conversation History */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Conversation History</Text>
                    {userHistory.length > 0 ? (
                      <FlatList
                        data={userHistory}
                        keyExtractor={item => item.id}
                        renderItem={renderMessageItem}
                        scrollEnabled={false}
                      />
                    ) : (
                      <Text style={styles.emptyText}>No conversation history</Text>
                    )}
                  </View>
                  
                  {/* Structured Summary */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Memory Summary</Text>
                    {userSummary ? (
                      <View style={styles.summaryContainer}>
                        <Text style={styles.summaryLabel}>Updated: {formatDate(userSummary.updatedAt)}</Text>
                        <View style={styles.jsonContainer}>
                          <Text style={styles.jsonText}>
                            {JSON.stringify(userSummary.summaryData, null, 2)}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.emptyText}>No summary data available</Text>
                    )}
                  </View>
                </ScrollView>
              )}
            </>
          ) : (
            !loading && <Text style={styles.selectPrompt}>Please select a user</Text>
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
    width: '30%',
    borderRightWidth: 1,
    borderRightColor: '#dee2e6',
    paddingRight: 16,
  },
  userDetails: {
    flex: 1,
    paddingLeft: 16,
  },
  list: {
    paddingBottom: 20,
  },
  userItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    } : {}),
    ...(Platform.OS === 'android' ? {
      elevation: 2,
    } : {}),
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    } : {}),
  },
  selectedUserItem: {
    backgroundColor: '#e9f5fe',
    borderColor: '#007bff',
    borderWidth: 1,
  },
  userName: {
    fontWeight: '500',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailsContent: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#495057',
  },
  messageItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  userMessage: {
    backgroundColor: '#e9ecef',
    alignSelf: 'flex-end',
    marginLeft: 40,
  },
  assistantMessage: {
    backgroundColor: '#f1f8ff',
    alignSelf: 'flex-start',
    marginRight: 40,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  messageRole: {
    fontSize: 12,
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
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    } : {}),
    ...(Platform.OS === 'android' ? {
      elevation: 3,
    } : {}),
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    } : {}),
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 8,
  },
  jsonContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  jsonText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 13,
  },
  emptyText: {
    fontStyle: 'italic',
    color: '#6c757d',
    marginTop: 8,
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
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  generateButton: {
    marginVertical: 10,
  },
});

export default AdminUserScreen;
