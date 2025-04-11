import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Column } from '../layout';
import { createColoredShadow, spacing } from '../../theme';

interface DiamondIndicatorProps {
  value: number;
  color: string;
  size?: number;
  label: string;
}

/**
 * A diamond-shaped skill indicator with a colored shadow
 */
export const DiamondIndicator = ({ 
  value, 
  color, 
  size = 60, 
  label 
}: DiamondIndicatorProps) => {
  // Create a colored shadow based on the diamond's color
  const shadow = createColoredShadow(color, 3);
  
  return (
    <Column alignItems="center" style={styles.container}>
      <View 
        style={[
          styles.diamond,
          {
            width: size,
            height: size,
            backgroundColor: color,
            ...shadow,
          }
        ]}
      >
        <Text style={[
          styles.value,
          { 
            fontSize: size / 2.5,
          }
        ]}>
          {value}
        </Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </Column>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 4,
  },
  diamond: {
    borderRadius: 4,
    transform: [{ rotate: '45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  value: {
    color: '#fff',
    fontWeight: 'bold',
    transform: [{ rotate: '-45deg' }],
  },
  label: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: spacing.sm,
  },
});

export default DiamondIndicator;