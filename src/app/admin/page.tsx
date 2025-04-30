'use client';

import React, { useState } from 'react';
import { Button, Column } from '../../components';
import styles from './page.module.css';

// These will be imported from their page component versions
import AdminUserScreen from '../admin-user/page';
import SummarizationStatusScreen from '../summarization-status/page';
import FeedbackScreen from '../feedback/page';

export default function AdminPage() {
  const [activeView, setActiveView] = useState<'users' | 'status' | 'feedback'>('users');

  return (
    <div className={styles.container} style={{ backgroundColor: '#FFFFFF' }}>
      <Column gap={16} style={{ height: '100%' }}>
        <div className={styles.header}>
          <div className={styles.segmentedButtons}>
            <Button
              mode={activeView === 'users' ? 'contained' : 'outlined'}
              onClick={() => setActiveView('users')}
              className={styles.segmentButton}
            >
              User Inspector
            </Button>
            <Button
              mode={activeView === 'status' ? 'contained' : 'outlined'}
              onClick={() => setActiveView('status')}
              className={styles.segmentButton}
            >
              Summarization Status
            </Button>
            <Button
              mode={activeView === 'feedback' ? 'contained' : 'outlined'}
              onClick={() => setActiveView('feedback')}
              className={styles.segmentButton}
            >
              Feedback
            </Button>
          </div>
        </div>
        
        <div className={styles.content}>
          {activeView === 'users' && <AdminUserScreen />}
          {activeView === 'status' && <SummarizationStatusScreen />}
          {activeView === 'feedback' && <FeedbackScreen />}
        </div>
      </Column>
    </div>
  );
}