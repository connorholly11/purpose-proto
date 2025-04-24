import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { ChatPage } from '../chat';
import SystemPromptsManager from './SystemPromptsManager';
import ProfileSheet from './ProfileSheet';

// This is a simple debug version of AdminRoot
export default function AdminRootDebug() {
  const { paperTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('companion');
  const navigation = useNavigation();
  // We don't use the AdminToggleContext in this component anymore
  
  // Handle navigation to profile sheet
  const openProfileSheet = () => {
    if (Platform.OS === 'ios') {
      navigation.navigate('ProfileSheet' as never);
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'companion' ? <ChatPage /> : <SystemPromptsManager />}
      </View>
      
      {/* No exit button - users leave admin mode by clicking the "A" button */}
      
      {/* Bottom Tabs */}
      <SafeAreaView style={[styles.tabBarContainer, { backgroundColor: paperTheme.colors.surface }]}>
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={styles.tab} 
            onPress={() => setActiveTab('companion')}
          >
            <MaterialIcons 
              name="chat" 
              size={24} 
              color={activeTab === 'companion' ? paperTheme.colors.primary : paperTheme.colors.onSurfaceVariant} 
            />
            <Text style={{ 
              color: activeTab === 'companion' ? 
                paperTheme.colors.primary : 
                paperTheme.colors.onSurfaceVariant,
              fontSize: 12,
              marginTop: 2
            }}>
              Companion
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.tab}
            onPress={() => setActiveTab('prompts')}
          >
            <MaterialIcons 
              name="format-quote" 
              size={24} 
              color={activeTab === 'prompts' ? paperTheme.colors.primary : paperTheme.colors.onSurfaceVariant} 
            />
            <Text style={{ 
              color: activeTab === 'prompts' ? 
                paperTheme.colors.primary : 
                paperTheme.colors.onSurfaceVariant,
              fontSize: 12,
              marginTop: 2
            }}>
              Prompts
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBarContainer: {
    borderTopWidth: 0.5,
    borderTopColor: '#ccc',
  },
  tabBar: {
    flexDirection: 'row',
    height: 60,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabContent: {
    flex: 1,
  },
});