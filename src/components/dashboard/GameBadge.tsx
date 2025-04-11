import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Column } from '../layout';
import { spacing } from '../../theme';

interface GameBadgeProps {
  icon: string;
  label: string;
  isUnlocked: boolean;
}

/**
 * A badge component showing achievements
 */
export const GameBadge = ({ icon, label, isUnlocked }: GameBadgeProps) => {
  return (
    <View style={[
      styles.container,
      { backgroundColor: isUnlocked ? '#1f2937' : '#111827' }
    ]}>
      <Column spacing="xs" alignItems="center" style={styles.content}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.label}>{label}</Text>
      </Column>
      
      {!isUnlocked && (
        <View style={styles.lockedOverlay}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  content: {
    padding: spacing.md,
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    textAlign: 'center',
    color: '#9ca3af',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: {
    fontSize: 20,
  },
});

export default GameBadge;