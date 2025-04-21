import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withRepeat,
  withDelay,
  cancelAnimation,
} from 'react-native-reanimated';

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
  const dotColor = color ?? theme.colors.primary;
  
  // Replace useEffect logic with Reanimated composition
  React.useEffect(() => {
    const half = duration / 2;

    // grow → shrink → pause (1->1.2->1->pause) forever
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: half }),
        withTiming(1,   { duration: half }),
        // Use withDelay to pause before restarting the sequence
        withDelay(pauseDuration, withTiming(1, { duration: 0 }))
      ),
      -1,   // -1 = infinite
      false // do not reverse the sequence
    );

    // Cleanup function to cancel the animation
    return () => cancelAnimation(scale);
  }, [duration, pauseDuration]);
  
  // Add 'worklet' directive
  const animatedStyle = useAnimatedStyle(() => {
    'worklet'; 
    return { transform: [{ scale: scale.value }] };
  });
  
  return (
    <Animated.View
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