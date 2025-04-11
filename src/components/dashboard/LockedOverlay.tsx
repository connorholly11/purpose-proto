import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Column } from '../layout';
import { spacing } from '../../theme';

interface LockedOverlayProps {
  message?: string;
  level?: number;
  unlocksAt?: number;
}

/**
 * An overlay component for locked features
 */
export const LockedOverlay = ({ 
  message = "Locked", 
  level = 0, 
  unlocksAt = 5 
}: LockedOverlayProps) => {
  const theme = useTheme();
  
  return (
    <View style={styles.container}>
      <Column spacing="sm" alignItems="center">
        <Text style={styles.icon}>🔒</Text>
        <Text style={[styles.message, { color: '#d1d5db' }]}>{message}</Text>
        <Text style={[styles.unlockInfo, { color: '#6b7280' }]}>Unlocks at level {unlocksAt}</Text>
        
        <View style={styles.progressContainer}>
          <View 
            style={[
              styles.progressBar, 
              { 
                width: `${Math.min(100, (level/unlocksAt) * 100)}%`, 
                backgroundColor: theme.colors.primary 
              }
            ]}
          />
        </View>
      </Column>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    zIndex: 20
  },
  icon: {
    fontSize: 24,
  },
  message: {
    fontWeight: '500',
  },
  unlockInfo: {
    fontSize: 12,
  },
  progressContainer: {
    marginTop: spacing.sm,
    width: 128,
    height: 6,
    backgroundColor: '#1f2937',
    borderRadius: 999,
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    borderRadius: 999
  }
});

export default LockedOverlay;