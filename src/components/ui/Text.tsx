import React from 'react';
import styles from './styles.module.css';

interface TextProps {
  children: React.ReactNode;
  variant?: 'body' | 'title' | 'subtitle' | 'caption' | 'label' | 'paragraph';
  weight?: 'normal' | 'medium' | 'bold';
  style?: React.CSSProperties;
  className?: string;
}

export const Text: React.FC<TextProps> = ({
  children,
  variant = 'body',
  weight = 'normal',
  style,
  className = '',
}) => {
  const getWeightClassName = () => {
    if (weight === 'medium') return styles.medium;
    if (weight === 'bold') return styles.bold;
    return '';
  };

  const textStyle: React.CSSProperties = {
    ...style,
  };

  const Component = variant === 'title' 
    ? 'h1' 
    : variant === 'subtitle' 
      ? 'h2' 
      : variant === 'paragraph' 
        ? 'p' 
        : 'span';

  return (
    <Component 
      className={`${styles.text} ${styles[variant]} ${getWeightClassName()} ${className}`} 
      style={textStyle}
    >
      {children}
    </Component>
  );
};

export default Text;