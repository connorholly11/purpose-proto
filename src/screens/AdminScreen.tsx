import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SegmentedButtons, useTheme } from 'react-native-paper';
import AdminUserScreen from './AdminUserScreen';
import SummarizationStatusScreen from './SummarizationStatusScreen';
import FeedbackScreen from './FeedbackScreen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Column } from '../components';
import { spacing } from '../theme';

const AdminScreen = () => {
  const [activeView, setActiveView] = useState<'users' | 'status' | 'feedback'>('users');
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Column spacing="md" fullHeight>
        <Column spacing="sm" style={styles.header}>
          <SegmentedButtons
            value={activeView}
            onValueChange={(value) => setActiveView(value as 'users' | 'status' | 'feedback')}
            buttons={[
              { value: 'users', label: 'User Inspector' },
              { value: 'status', label: 'Summarization Status' },
              { value: 'feedback', label: 'Feedback' },
            ]}
          />
        </Column>
        
        <Column style={styles.content}>
          {activeView === 'users' && <AdminUserScreen />}
          {activeView === 'status' && <SummarizationStatusScreen />}
          {activeView === 'feedback' && <FeedbackScreen />}
        </Column>
      </Column>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  header: { 
    paddingHorizontal: spacing.md, 
    paddingTop: spacing.md, 
    paddingBottom: spacing.sm,
  },
  content: { 
    flex: 1,
  },
});

export default AdminScreen;