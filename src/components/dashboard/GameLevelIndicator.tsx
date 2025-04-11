import React from 'react';
import { View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Row } from '../layout';

interface GameLevelIndicatorProps {
  level: number;
  maxLevel: number;
  activeColor?: string;
  inactiveColor?: string;
}

/**
 * A visual level indicator showing progress as a series of bars
 */
export const GameLevelIndicator = ({ 
  level, 
  maxLevel, 
  activeColor, 
  inactiveColor 
}: GameLevelIndicatorProps) => {
  const theme = useTheme();
  
  // Use provided colors or fall back to theme colors
  const active = activeColor || theme.colors.primary;
  const inactive = inactiveColor || '#374151';
  
  return (
    <Row spacing="xs">
      {[...Array(maxLevel)].map((_, i) => (
        <View 
          key={i} 
          style={{ 
            width: 8, 
            height: 16, 
            borderRadius: 2,
            backgroundColor: i < level ? active : inactive 
          }}
        />
      ))}
    </Row>
  );
};

export default GameLevelIndicator;