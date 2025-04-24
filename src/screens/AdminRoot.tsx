import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { UserChat } from '../components/chat/UserChat';
import SystemPromptsManager from './SystemPromptsManager';

export default function AdminRoot() {
  const { paperTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('companion');
  
  return (
    <View style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
      {/* Custom Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: paperTheme.colors.surface }]}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'companion' && { 
              borderBottomWidth: 2, 
              borderBottomColor: paperTheme.colors.primary 
            }
          ]} 
          onPress={() => setActiveTab('companion')}
        >
          <Text style={{ 
            color: activeTab === 'companion' ? 
              paperTheme.colors.primary : 
              paperTheme.colors.onSurfaceVariant 
          }}>
            Companion
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'prompts' && { 
              borderBottomWidth: 2, 
              borderBottomColor: paperTheme.colors.primary 
            }
          ]} 
          onPress={() => setActiveTab('prompts')}
        >
          <Text style={{ 
            color: activeTab === 'prompts' ? 
              paperTheme.colors.primary : 
              paperTheme.colors.onSurfaceVariant 
          }}>
            SystemPrompts
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'companion' ? <UserChat /> : <SystemPromptsManager />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: 48,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabContent: {
    flex: 1,
  }
});