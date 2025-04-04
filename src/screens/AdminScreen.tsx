import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';
import AdminUserScreen from './AdminUserScreen';
import SummarizationStatusScreen from './SummarizationStatusScreen'; // Will create later
import FeedbackScreen from './FeedbackScreen';
import { SafeAreaView } from 'react-native-safe-area-context';

const AdminScreen = () => {
  const [activeView, setActiveView] = useState<'users' | 'status' | 'feedback'>('users');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <SegmentedButtons
          value={activeView}
          onValueChange={(value) => setActiveView(value as 'users' | 'status' | 'feedback')}
          buttons={[
            { value: 'users', label: 'User Inspector' },
            { value: 'status', label: 'Summarization Status' },
            { value: 'feedback', label: 'Feedback' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>
      <View style={styles.content}>
        {activeView === 'users' && <AdminUserScreen />}
        {activeView === 'status' && <SummarizationStatusScreen />}
        {activeView === 'feedback' && <FeedbackScreen />}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  header: { 
    paddingHorizontal: 16, 
    paddingTop: 16, 
    paddingBottom: 8 
  },
  segmentedButtons: {
    // Add any specific styling needed
  },
  content: { 
    flex: 1 
  },
});

export default AdminScreen; 