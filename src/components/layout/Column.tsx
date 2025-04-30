import React from 'react';
import { Column as WebColumn } from '../components';

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
 * A flex column component for web
 */
export const Column: React.FC<ColumnProps> = (props) => {
  return <WebColumn {...props} />;
};

export default Column;