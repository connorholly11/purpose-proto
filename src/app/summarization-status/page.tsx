'use client';

import React from 'react';
import { Text, Card, Column } from '../../components';
import styles from './page.module.css';

export default function SummarizationStatusPage() {
  // This is a placeholder - you would implement the actual functionality here
  return (
    <div className={styles.container}>
      <Column gap={16}>
        <Text variant="title">Summarization Status</Text>
        
        <Card title="Status Dashboard">
          <Text>
            This is where you would view summarization status in the web application.
            This component has been migrated from React Native to a Next.js page.
          </Text>
        </Card>
      </Column>
    </div>
  );
}