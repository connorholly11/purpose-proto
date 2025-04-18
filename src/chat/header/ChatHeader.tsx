import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { Surface } from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import { useSystemPrompts } from '../../context/SystemPromptContext';
import { useAuthContext } from '../../context/AuthContext';
import { getThemeColors } from '../styles';
import { createPlatformStyleSheet, spacing } from '../../theme';

type ChatHeaderProps = {
  admin: boolean;
  conversationId: string | null;
  currentModel: string | null;
  conversationCost: number;
  useUserContext: boolean;
  onContextToggle: (value: boolean) => void;
  onNewChat: () => void;
};

export const ChatHeader = ({
  admin,
  conversationId,
  currentModel,
  conversationCost,
  useUserContext,
  onContextToggle,
  onNewChat,
}: ChatHeaderProps) => {
  const theme = useTheme();
  const COLORS = getThemeColors(theme);
  const { signOut } = useAuthContext();
  const { activePrompt, loadingPrompts } = useSystemPrompts();

  if (!admin) return null;

  return (
    <Surface style={styles.headerContainer} elevation={1}>
      <View style={styles.headerContent}>
        <Text style={[styles.headerText, { color: COLORS.headerText }]}>
          {!loadingPrompts && activePrompt ? `${activePrompt.name}` : 'AI Assistant'}
          {currentModel && <Text style={styles.modelIndicator}> - {currentModel}</Text>}
          {!currentModel && <Text style={styles.modelIndicator}> - Default model</Text>}
          {conversationId && <Text style={styles.conversationIndicator}> (Conversation in progress)</Text>}
        </Text>
        
        {/* Display estimated conversation cost */}
        <Text style={styles.costIndicator}>
          {isNaN(conversationCost) 
            ? 'Cost: Calculating...' 
            : `Estimated cost: $${conversationCost.toFixed(6)}`}
        </Text>
        
        <View style={styles.adminControls}>
          <View style={styles.contextToggleContainer}>
            <Text style={[styles.contextToggleLabel, { color: COLORS.headerText }]}>User Context:</Text>
            <Switch
              value={useUserContext}
              onValueChange={(value) => {
                onContextToggle(value);
              }}
              trackColor={{ false: COLORS.switchTrackInactive, true: COLORS.switchTrackActive }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          {/* Start a new conversation - this is a true reset */}
          <TouchableOpacity 
            style={styles.newChatButton}
            onPress={onNewChat}
          >
            <Text style={styles.newChatText}>New Chat</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={signOut}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Surface>
  );
};

const styles = createPlatformStyleSheet({
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CCCCCC',
  },
  headerContent: {
    paddingHorizontal: spacing.md,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  conversationIndicator: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  modelIndicator: {
    fontSize: 12,
    color: '#0066CC',
    fontWeight: '500',
  },
  costIndicator: {
    fontSize: 11,
    color: '#34C759',
    marginTop: 2,
    marginBottom: 4,
  },
  adminControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  contextToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contextToggleLabel: {
    fontSize: 13,
    marginRight: 8,
  },
  newChatButton: {
    padding: 6,
    paddingHorizontal: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    marginRight: 8,
  },
  newChatText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  logoutButton: {
    padding: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ChatHeader;