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

interface ColumnProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | number;
  justifyContent?: JustifyContent;
  alignItems?: AlignItems;
  className?: string;
  children: React.ReactNode;
}

/**
 * A flex column component that replaces the React Native View with flexDirection="column"
 */
export const Column: React.FC<ColumnProps> = ({
  spacing = 'sm',
  justifyContent = 'flex-start',
  alignItems = 'stretch',
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

  const columnStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent,
    alignItems,
    gap: `${getSpacing()}px`,
    ...(style as React.CSSProperties),
  };

  return (
    <div className={`${styles.column} ${className}`} style={columnStyle} {...rest}>
      {children}
    </div>
  );
};

export default Column;