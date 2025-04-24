import React, { useState, useEffect } from 'react';
import { FlatList, StyleSheet, View, SafeAreaView } from 'react-native';
import { List, IconButton, ActivityIndicator, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthContext } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';

type SystemPrompt = {
  id: string;
  name: string;
  promptText: string;
  isActive: boolean;
  isFavorite: boolean;
  modelName: string;
};

export default function SystemPromptsManager() {
  const theme = useTheme();
  const api = useApi();
  const { userId } = useAuthContext();
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [activePrompt, setActivePrompt] = useState<SystemPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const insets = useSafeAreaInsets();

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      // Use the raw axios instance from the API service
      const response = await api.raw.get('/api/admin/system-prompts');
      setPrompts(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching prompts:', err);
      setError(err instanceof Error ? err : new Error('Failed to load prompts'));
    } finally {
      setLoading(false);
    }
  };

  // Fetch the active prompt for the current user
  const fetchActive = async () => {
    try {
      const response = await api.prompts.getUserActive(userId);
      setActivePrompt(response.data);
    } catch (err) {
      console.error('Error fetching active prompt:', err);
    }
  };

  useEffect(() => {
    fetchPrompts();
    fetchActive();
  }, []);

  const activatePrompt = async (id: string) => {
    try {
      // Use the dedicated prompts service
      await api.prompts.setActive(id, userId);
      // Refresh both lists
      fetchPrompts();
      fetchActive();
    } catch (err) {
      console.error('Error activating prompt:', err);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !prompts) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text>Error loading prompts: {error?.message}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Active prompt header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top > 0 ? 8 : insets.top + 8 }]}>
        {activePrompt ? (
          <Text style={[styles.headerText, { color: theme.colors.onBackground }]}>
            Current active: {activePrompt.name} ({activePrompt.id.slice(0, 8)})
          </Text>
        ) : (
          <Text style={[styles.headerText, { color: theme.colors.onSurfaceVariant }]}>
            Loading active prompt...
          </Text>
        )}
      </View>
      
      <FlatList
        data={prompts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <List.Item
            title={item.name}
            description={`${item.modelName} • ${item.id.slice(0, 8)}${item.isFavorite ? ' ★' : ''}`}
            right={() => (
              <View style={styles.rightContainer}>
                {item.isActive && (
                  <IconButton
                    icon="check"
                    size={20}
                    iconColor={theme.colors.primary}
                  />
                )}
              </View>
            )}
            onPress={() => activatePrompt(item.id)}
            style={{
              backgroundColor: theme.colors.surface,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.outlineVariant,
            }}
            titleStyle={{ color: theme.colors.onSurface }}
            descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '500',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});