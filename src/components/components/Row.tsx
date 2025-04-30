import React from 'react';
import styles from './Layout.module.css';

type JustifyContent = 
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'space-between'
  | 'space-around'
  | 'space-evenly';

type AlignItems = 
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'stretch'
  | 'baseline';

interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | number;
  justifyContent?: JustifyContent;
  alignItems?: AlignItems;
  wrap?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * A flex row component that replaces the React Native View with flexDirection="row"
 */
export const Row: React.FC<RowProps> = ({
  spacing = 'sm',
  justifyContent = 'flex-start',
  alignItems = 'center',
  wrap = false,
  className = '',
  children,
  style,
  ...rest
}) => {
  const getSpacing = () => {
    if (typeof spacing === 'number') return spacing;
    
    const spacingMap = {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48,
    };
    
    return spacingMap[spacing] || 8;
  };

  const rowStyle = {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent,
    alignItems,
    flexWrap: wrap ? 'wrap' as const : 'nowrap' as const,
    gap: `${getSpacing()}px`,
    ...(style as React.CSSProperties),
  };

  return (
    <div className={`${styles.row} ${className}`} style={rowStyle} {...rest}>
      {children}
    </div>
  );
};

export default Row;