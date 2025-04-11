import React from 'react';
import { StyleSheet, ViewProps } from 'react-native';
import { Surface, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { createShadow, spacing } from '../../theme';

interface HolographicCardProps extends ViewProps {
  children: React.ReactNode;
  style?: any;
  gradientColors?: string[];
  gradientStart?: { x: number; y: number };
  gradientEnd?: { x: number; y: number };
  borderColor?: string;
  elevation?: number;
}

/**
 * A card with holographic effect using LinearGradient
 */
export const HolographicCard = ({ 
  children, 
  style,
  gradientColors,
  gradientStart,
  gradientEnd,
  borderColor,
  elevation = 1,
  ...rest 
}: HolographicCardProps) => {
  const theme = useTheme();
  
  // Default or custom gradient colors
  const colors = gradientColors || ['rgba(96, 165, 250, 0.05)', 'rgba(155, 81, 255, 0.05)'];
  // Default or custom gradient direction
  const start = gradientStart || { x: 0, y: 0 };
  const end = gradientEnd || { x: 1, y: 1 };
  // Default or custom border color
  const border = borderColor || 'rgba(255,255,255,0.1)';
  
  return (
    <Surface 
      style={[
        styles.card,
        { borderColor: border },
        style
      ]}
      elevation={elevation}
      {...rest}
    >
      <LinearGradient
        colors={colors}
        start={start}
        end={end}
        style={styles.gradient}
      >
        {children}
      </LinearGradient>
    </Surface>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    ...createShadow(1),
  },
  gradient: {
    padding: spacing.md,
  },
});

export default HolographicCard;