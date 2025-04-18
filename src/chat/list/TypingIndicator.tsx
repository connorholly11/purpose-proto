import React, { useState, useRef, useEffect } from 'react';
import { View, Animated } from 'react-native';
import { useTheme } from 'react-native-paper';
import { getThemeColors } from '../styles';
import { bubbleStyles } from '../styles';

export const TypingIndicator = () => {
  const theme = useTheme();
  const COLORS = getThemeColors(theme);
  
  // Create animated values for the dots
  const dot1Opacity = useRef(new Animated.Value(0.4)).current;
  const dot2Opacity = useRef(new Animated.Value(0.4)).current;
  const dot3Opacity = useRef(new Animated.Value(0.4)).current;
  
  const [scaleAnim] = useState(new Animated.Value(0.95));
  const [fadeAnim] = useState(new Animated.Value(0));
  
  // Animation sequence
  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
    
    const createAnimation = (value: Animated.Value, delay: number) => {
      return Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration: 400,
          delay,
          useNativeDriver: true
        }),
        Animated.timing(value, {
          toValue: 0.4,
          duration: 400,
          useNativeDriver: true
        })
      ]);
    };
    
    // Run the animations in a loop
    const runAnimation = () => {
      Animated.parallel([
        createAnimation(dot1Opacity, 0),
        createAnimation(dot2Opacity, 200),
        createAnimation(dot3Opacity, 400)
      ]).start(() => runAnimation());
    };
    
    runAnimation();
    
    // Clean up animations on unmount
    return () => {
      dot1Opacity.stopAnimation();
      dot2Opacity.stopAnimation();
      dot3Opacity.stopAnimation();
    };
  }, []);
  
  return (
    <Animated.View style={{
      opacity: fadeAnim,
      transform: [{ scale: scaleAnim }],
      alignSelf: 'flex-start',
      marginBottom: 16,
    }}>
      <View style={[bubbleStyles.messageBubble, bubbleStyles.aiBubble, bubbleStyles.typingContainer]}>
        <View style={bubbleStyles.typingDotsContainer}>
          <Animated.View style={[bubbleStyles.typingDot, { opacity: dot1Opacity, backgroundColor: COLORS.typingDots }]} />
          <Animated.View style={[bubbleStyles.typingDot, { opacity: dot2Opacity, backgroundColor: COLORS.typingDots }]} />
          <Animated.View style={[bubbleStyles.typingDot, { opacity: dot3Opacity, backgroundColor: COLORS.typingDots }]} />
        </View>
      </View>
      <View 
        style={[
          bubbleStyles.tailStyle,
          bubbleStyles.aiTail,
          { backgroundColor: COLORS.assistantBubble }
        ]} 
      />
    </Animated.View>
  );
};

export default TypingIndicator;