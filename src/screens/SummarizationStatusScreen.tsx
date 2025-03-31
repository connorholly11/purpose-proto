import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Text, Chip, Card, Button, Divider } from 'react-native-paper';
import { useApi } from '../hooks/useApi';

// Define types for summarization logs
type SummarizationLog = {
  id: string;
  userId: string;
  status: 'started' | 'completed' | 'failed';
  trigger: string;
  details?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    username?: string;
  };
};

const SummarizationStatusScreen = () => {
  const [logs, setLogs] = useState<SummarizationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const api = useApi();
  
  // Load summarization logs
  const loadLogs = useCallback(async () => {
    try {
      setError(null);
      const response = await api.admin.getSummarizationLogs();
      setLogs(response);
    } catch (err) {
      setError('Failed to load summarization logs');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api]);
  
  // Load logs on component mount
  useEffect(() => {
    loadLogs();
  }, [loadLogs]);
  
  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadLogs();
  }, [loadLogs]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid Date';
    }
  };
  
  // Get color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'started':
        return '#ffc107'; // Amber
      case 'completed':
        return '#4caf50'; // Green
      case 'failed':
        return '#f44336'; // Red
      default:
        return '#9e9e9e'; // Grey
    }
  };
  
  // Render an individual log item
  const renderLogItem = ({ item }: { item: SummarizationLog }) => (
    <Card style={styles.logItem}>
      <Card.Content>
        <View style={styles.logHeader}>
          <Chip 
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
          >
            {item.status.toUpperCase()}
          </Chip>
          <Text style={styles.timestamp}>{formatDate(item.createdAt)}</Text>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.logDetail}>
          <Text>User: <Text style={styles.emphasisText}>{item.user?.username || item.userId.substring(0, 12) + '...'}</Text></Text>
          <Text>Trigger: <Text style={styles.emphasisText}>{item.trigger}</Text></Text>
          {item.details && (
            <View style={styles.detailsContainer}>
              <Text style={styles.detailsLabel}>Details:</Text>
              <Text style={styles.detailsText}>{item.details}</Text>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );
  
  // If still loading initially, show a spinner
  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading summarization logs...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={loadLogs}>
            Retry
          </Button>
        </View>
      )}
      
      <FlatList
        data={logs}
        renderItem={renderLogItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007bff']}
          />
        }
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No summarization logs found</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffebee', // Light red
    margin: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: '#d32f2f', // Dark red
    marginBottom: 10,
  },
  listContent: {
    padding: 10,
  },
  logItem: {
    marginBottom: 10,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusChip: {
    height: 28,
  },
  timestamp: {
    color: '#666',
    fontSize: 12,
  },
  divider: {
    marginVertical: 8,
  },
  logDetail: {
    marginTop: 5,
  },
  emphasisText: {
    fontWeight: 'bold',
  },
  detailsContainer: {
    marginTop: 8,
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
  },
  detailsLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 13,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
});

export default SummarizationStatusScreen; 