import React from 'react';
import { ViewProps, StyleSheet } from 'react-native';
import { Card as PaperCard, Text } from 'react-native-paper';
import { spacing } from '../../theme/platformUtils';

interface CardProps extends ViewProps {
  title?: string;
  subtitle?: string;
  elevation?: number;
  onPress?: () => void;
  contentStyle?: any;
}

/**
 * A consistent card component that wraps React Native Paper's Card
 * and handles platform-specific styling
 */
export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  elevation = 1,
  onPress,
  style,
  contentStyle,
  children,
  ...rest
}) => {
  return (
    <PaperCard 
      style={[styles.card, style]} 
      elevation={elevation}
      onPress={onPress}
      {...rest}
    >
      {(title || subtitle) && (
        <PaperCard.Title 
          title={title} 
          subtitle={subtitle}
          titleStyle={styles.title}
          subtitleStyle={styles.subtitle}
        />
      )}
      <PaperCard.Content style={[styles.content, contentStyle]}>
        {children}
      </PaperCard.Content>
    </PaperCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.sm,
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
  },
  content: {
    paddingTop: spacing.xs,
  },
});

export default Card;