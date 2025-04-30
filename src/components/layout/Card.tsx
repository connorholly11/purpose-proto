import React from 'react';
import { Card as WebCard } from '../components';
import { spacing } from '../../theme/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  elevation?: number;
  onPress?: () => void;
  contentStyle?: React.CSSProperties;
  children: React.ReactNode;
}

/**
 * A consistent card component for the web environment
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
    <WebCard 
      title={title}
      subtitle={subtitle}
      elevation={elevation}
      onPress={onPress}
      style={{
        marginVertical: spacing.sm,
        borderRadius: 8,
        ...style as React.CSSProperties
      }} 
      contentStyle={contentStyle}
      {...rest}
    >
      {children}
    </WebCard>
  );
};

export default Card;