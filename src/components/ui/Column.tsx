import React from 'react';
import styles from './styles.module.css';

interface ColumnProps {
  children: React.ReactNode;
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  gap?: number;
  style?: React.CSSProperties;
  className?: string;
}

export const Column: React.FC<ColumnProps> = ({
  children,
  justifyContent = 'flex-start',
  alignItems = 'flex-start',
  flexWrap = 'nowrap',
  gap = 0,
  style,
  className = '',
}) => {
  const columnStyle: React.CSSProperties = {
    justifyContent,
    alignItems,
    flexWrap,
    gap: gap ? `${gap}px` : undefined,
    ...style,
  };

  return (
    <div className={`${styles.column} ${className}`} style={columnStyle}>
      {children}
    </div>
  );
};

export default Column;