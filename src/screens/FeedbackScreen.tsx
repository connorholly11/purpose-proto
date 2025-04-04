import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  RefreshControl,
  ActivityIndicator 
} from 'react-native';
import { 
  Text, 
  Chip, 
  Card, 
  Button, 
  Divider,
  Menu,
  Searchbar,
  IconButton
} from 'react-native-paper';
import { useApi } from '../hooks/useApi';

// Define types for feedback items
type Feedback = {
  id: string;
  userId: string;
  category: string;
  content: string;
  status: 'new' | 'reviewed' | 'resolved';
  createdAt: string;
  updatedAt: string;
  user?: {
    username?: string;
  };
};

const FeedbackScreen = () => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  
  const api = useApi();
  
  // Load feedback items
  const loadFeedback = useCallback(async () => {
    try {
      setError(null);
      
      const filters: { category?: string; status?: string } = {};
      if (categoryFilter) filters.category = categoryFilter;
      if (statusFilter) filters.status = statusFilter;
      
      const response = await api.admin.getFeedback(filters);
      setFeedback(response);
    } catch (err) {
      setError('Failed to load feedback items');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, categoryFilter, statusFilter]);
  
  // Load feedback on component mount
  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);
  
  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFeedback();
  }, [loadFeedback]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid Date';
    }
  };
  
  // Update feedback status
  const updateStatus = async (id: string, status: 'new' | 'reviewed' | 'resolved') => {
    try {
      await api.admin.updateFeedbackStatus(id, status);
      // Update local state
      setFeedback(prevFeedback => 
        prevFeedback.map(item => 
          item.id === id ? { ...item, status } : item
        )
      );
      setMenuVisible(null);
    } catch (err) {
      console.error('Error updating feedback status:', err);
      setError('Failed to update feedback status');
    }
  };
  
  // Get color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return '#2196f3'; // Blue
      case 'reviewed':
        return '#ff9800'; // Orange
      case 'resolved':
        return '#4caf50'; // Green
      default:
        return '#9e9e9e'; // Grey
    }
  };
  
  // Get color based on category
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'ai companion':
        return '#9c27b0'; // Purple
      case 'memory':
        return '#00bcd4'; // Cyan
      case 'other':
        return '#607d8b'; // Blue Grey
      default:
        return '#9e9e9e'; // Grey
    }
  };
  
  // Render status menu for each feedback item
  const renderStatusMenu = (item: Feedback) => (
    <Menu
      visible={menuVisible === item.id}
      onDismiss={() => setMenuVisible(null)}
      anchor={
        <Button 
          mode="outlined" 
          onPress={() => setMenuVisible(item.id)}
          style={[styles.statusButton, { borderColor: getStatusColor(item.status) }]}
        >
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Button>
      }
    >
      <Menu.Item 
        onPress={() => updateStatus(item.id, 'new')} 
        title="New"
        disabled={item.status === 'new'}
      />
      <Menu.Item 
        onPress={() => updateStatus(item.id, 'reviewed')} 
        title="Reviewed"
        disabled={item.status === 'reviewed'}
      />
      <Menu.Item 
        onPress={() => updateStatus(item.id, 'resolved')} 
        title="Resolved"
        disabled={item.status === 'resolved'}
      />
    </Menu>
  );
  
  // Render filter chips
  const renderFilterChips = () => (
    <View style={styles.filterContainer}>
      <Text style={styles.filterLabel}>Filter by:</Text>
      
      <View style={styles.chipGroup}>
        <Text style={styles.chipGroupLabel}>Category:</Text>
        <Chip 
          selected={categoryFilter === null}
          onPress={() => setCategoryFilter(null)}
          style={styles.chip}
        >
          All
        </Chip>
        <Chip 
          selected={categoryFilter === 'AI Companion'}
          onPress={() => setCategoryFilter('AI Companion')}
          style={styles.chip}
        >
          AI Companion
        </Chip>
        <Chip 
          selected={categoryFilter === 'Memory'}
          onPress={() => setCategoryFilter('Memory')}
          style={styles.chip}
        >
          Memory
        </Chip>
        <Chip 
          selected={categoryFilter === 'Other'}
          onPress={() => setCategoryFilter('Other')}
          style={styles.chip}
        >
          Other
        </Chip>
      </View>
      
      <View style={styles.chipGroup}>
        <Text style={styles.chipGroupLabel}>Status:</Text>
        <Chip 
          selected={statusFilter === null}
          onPress={() => setStatusFilter(null)}
          style={styles.chip}
        >
          All
        </Chip>
        <Chip 
          selected={statusFilter === 'new'}
          onPress={() => setStatusFilter('new')}
          style={styles.chip}
        >
          New
        </Chip>
        <Chip 
          selected={statusFilter === 'reviewed'}
          onPress={() => setStatusFilter('reviewed')}
          style={styles.chip}
        >
          Reviewed
        </Chip>
        <Chip 
          selected={statusFilter === 'resolved'}
          onPress={() => setStatusFilter('resolved')}
          style={styles.chip}
        >
          Resolved
        </Chip>
      </View>
    </View>
  );
  
  // Render an individual feedback item
  const renderFeedbackItem = ({ item }: { item: Feedback }) => (
    <Card style={styles.feedbackItem}>
      <Card.Content>
        <View style={styles.feedbackHeader}>
          <Chip 
            style={[styles.categoryChip, { backgroundColor: getCategoryColor(item.category) }]}
          >
            {item.category}
          </Chip>
          <Text style={styles.timestamp}>{formatDate(item.createdAt)}</Text>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.feedbackDetail}>
          <Text>From: <Text style={styles.emphasisText}>{item.user?.username || item.userId.substring(0, 12) + '...'}</Text></Text>
          <Text style={styles.contentLabel}>Feedback:</Text>
          <Text style={styles.contentText}>{item.content}</Text>
        </View>
        
        <View style={styles.actionRow}>
          {renderStatusMenu(item)}
        </View>
      </Card.Content>
    </Card>
  );
  
  // If still loading initially, show a spinner
  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading feedback items...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {renderFilterChips()}
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={loadFeedback}>
            Retry
          </Button>
        </View>
      )}
      
      <FlatList
        data={feedback}
        renderItem={renderFeedbackItem}
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
              <Text style={styles.emptyText}>No feedback items found</Text>
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
  filterContainer: {
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterLabel: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
  },
  chipGroupLabel: {
    marginRight: 8,
    fontWeight: 'bold',
  },
  chip: {
    margin: 4,
  },
  listContent: {
    padding: 10,
  },
  feedbackItem: {
    marginBottom: 10,
    elevation: 2,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryChip: {
    height: 28,
  },
  timestamp: {
    color: '#666',
    fontSize: 12,
  },
  divider: {
    marginVertical: 8,
  },
  feedbackDetail: {
    marginTop: 5,
  },
  emphasisText: {
    fontWeight: 'bold',
  },
  contentLabel: {
    fontWeight: 'bold',
    marginTop: 8,
  },
  contentText: {
    fontSize: 14,
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  statusButton: {
    borderWidth: 2,
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

export default FeedbackScreen; 