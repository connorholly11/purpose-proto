import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import Reanimated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface PulseIndicatorProps {
  size?: number;
  color?: string;
  duration?: number;
  style?: ViewStyle;
  pauseDuration?: number;
}

/**
 * A pulsing animated dot indicator
 */
export const PulseIndicator = ({
  size = 12,
  color,
  duration = 1000,
  pauseDuration = 1000,
  style,
}: PulseIndicatorProps) => {
  const theme = useTheme();
  const scale = useSharedValue(1);
  
  // Use theme color if not provided
  const dotColor = color || theme.colors.primary;
  
  useEffect(() => {
    const pulse = () => {
      scale.value = withTiming(1.2, { duration });
      
      setTimeout(() => {
        scale.value = withTiming(1, { duration });
      }, duration);
      
      setTimeout(pulse, duration * 2 + pauseDuration);
    };
    
    pulse();
    
    return () => {
      // Cancel animation when component unmounts
      scale.value = 1;
    };
  }, [duration, pauseDuration]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  return (
    <Reanimated.View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: dotColor,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  dot: {
    marginRight: 8,
  },
});

export default PulseIndicator;