import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { spacing } from '../../theme/platformUtils';

interface ColumnProps extends ViewProps {
  spacing?: keyof typeof spacing | number;
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  fullHeight?: boolean;
}

/**
 * A consistent column layout component that handles spacing between children
 */
export const Column: React.FC<ColumnProps> = ({
  spacing: spacingKey = 'md',
  justifyContent = 'flex-start',
  alignItems = 'stretch',
  fullHeight = false,
  style,
  children,
  ...rest
}) => {
  // Determine the spacing value - either a predefined value or a custom number
  const spacingValue = typeof spacingKey === 'number' 
    ? spacingKey 
    : spacing[spacingKey];

  return (
    <View
      style={[
        styles.column,
        {
          justifyContent,
          alignItems,
          height: fullHeight ? '100%' : 'auto',
          gap: spacingValue,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  column: {
    flexDirection: 'column',
  },
});

export default Column;