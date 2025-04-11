import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { spacing } from '../../theme/platformUtils';
import { getShadow } from '../../theme/platformUtils';

interface SectionProps extends ViewProps {
  title?: string;
  elevated?: boolean;
  elevation?: number;
  padding?: keyof typeof spacing | number;
}

/**
 * A consistent section component with optional title and elevation
 */
export const Section: React.FC<SectionProps> = ({
  title,
  elevated = false,
  elevation = 1,
  padding: paddingKey = 'md',
  style,
  children,
  ...rest
}) => {
  // Determine the padding value
  const paddingValue = typeof paddingKey === 'number' 
    ? paddingKey 
    : spacing[paddingKey];

  // If elevated, use Paper's Surface component which handles shadows correctly
  if (elevated) {
    return (
      <View style={[styles.container, style]} {...rest}>
        {title && <Text style={styles.title}>{title}</Text>}
        <Surface style={[styles.elevatedContainer, { padding: paddingValue, elevation }]}>
          {children}
        </Surface>
      </View>
    );
  }

  // Otherwise, use a simple View
  return (
    <View style={[styles.container, style]} {...rest}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={[styles.section, { padding: paddingValue }]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
    marginHorizontal: spacing.xs,
  },
  section: {
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  elevatedContainer: {
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    ...getShadow(1),
  },
});

export default Section;