import React from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Text, Button, Surface, useTheme } from 'react-native-paper';
import { Row, Column, Card, Section } from '../layout';
import { createPlatformStyleSheet, spacing, shadows } from '../../theme';

/**
 * This is an example component showcasing cross-platform styling best practices.
 * 
 * Key principles demonstrated:
 * 1. Using themed components from React Native Paper
 * 2. Using layout components (Row, Column, Card, Section) for consistent spacing
 * 3. Using platform-specific styling with createPlatformStyleSheet
 * 4. Using the shadows utility for consistent elevation across platforms
 */
const CrossPlatformExample = () => {
  const theme = useTheme();
  
  return (
    <Column spacing="lg" style={styles.container}>
      <Text style={styles.title}>Cross Platform Styling Demo</Text>
      
      {/* Card Example */}
      <Card title="Card Example" elevation={2}>
        <Text>This card uses React Native Paper and consistent shadows across platforms.</Text>
        <Row spacing="md" style={styles.buttonRow}>
          <Button mode="contained">Primary</Button>
          <Button mode="outlined">Secondary</Button>
        </Row>
      </Card>
      
      {/* Surface Example with platform-specific styles */}
      <Surface style={styles.surface} elevation={3}>
        <Text style={styles.surfaceText}>Platform-Adaptive Surface</Text>
        <Text>Current Platform: {Platform.OS}</Text>
      </Surface>
      
      {/* Section Example */}
      <Section title="Elevated Section" elevated elevation={2}>
        <Text>
          This section uses the Section component which handles platform-specific
          shadows and elevation consistently.
        </Text>
      </Section>
      
      {/* Custom component with platform-specific styling */}
      <TouchableOpacity style={styles.customButton}>
        <Text style={styles.buttonText}>
          Platform-Optimized Button
        </Text>
      </TouchableOpacity>
    </Column>
  );
};

// Using the platform-specific stylesheet creator
const styles = createPlatformStyleSheet({
  container: {
    padding: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    // Platform-specific font adjustments
    ios: {
      fontFamily: 'System',
      fontWeight: '700',
    },
    android: {
      fontFamily: 'sans-serif-medium',
    },
    web: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
  },
  buttonRow: {
    marginTop: spacing.md,
  },
  surface: {
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    // Platform-specific styling
    ios: {
      shadowColor: 'rgba(0,0,0,0.2)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
    },
    android: {
      elevation: 4,
    },
    web: {
      boxShadow: '0px 2px 8px rgba(0,0,0,0.15)',
    },
  },
  surfaceText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  customButton: {
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    backgroundColor: '#007AFF',
    // Use the shadows utility
    ...shadows.button,
    // Platform-specific adjustments
    ios: {
      backgroundColor: '#007AFF', // iOS blue
    },
    android: {
      backgroundColor: '#2196F3', // Material blue
    },
    web: {
      backgroundColor: '#0066CC', // Darker blue for web
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: '#0055AA',
      },
    },
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default CrossPlatformExample;