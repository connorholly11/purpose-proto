import React from 'react';
import { Row as WebRow } from '../web';

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
 * A flex row component for web
 */
export const Row: React.FC<RowProps> = (props) => {
  return <WebRow {...props} />;
};

export default Row;