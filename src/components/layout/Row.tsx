import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { spacing } from '../../theme/platformUtils';

interface RowProps extends ViewProps {
  spacing?: keyof typeof spacing | number;
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  wrap?: boolean;
  fullWidth?: boolean;
}

/**
 * A consistent row layout component that handles spacing between children
 */
export const Row: React.FC<RowProps> = ({
  spacing: spacingKey = 'md',
  justifyContent = 'flex-start',
  alignItems = 'center',
  wrap = false,
  fullWidth = true,
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
        styles.row,
        {
          justifyContent,
          alignItems,
          flexWrap: wrap ? 'wrap' : 'nowrap',
          width: fullWidth ? '100%' : 'auto',
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
  row: {
    flexDirection: 'row',
  },
});

export default Row;