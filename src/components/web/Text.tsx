import React from 'react';
import styles from './Layout.module.css';

interface TextProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'body' | 'title' | 'subtitle' | 'caption' | 'label' | 'paragraph';
  weight?: 'normal' | 'medium' | 'bold';
  color?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  children: React.ReactNode;
}

/**
 * A text component that replaces the React Native Text component
 */
export const Text: React.FC<TextProps> = ({
  variant = 'body',
  weight = 'normal',
  color,
  align = 'left',
  className = '',
  children,
  style,
  ...rest
}) => {
  const textStyle = {
    color,
    textAlign: align,
    ...(style as React.CSSProperties),
  };

  const getClassName = () => {
    const fontWeight = weight === 'normal' ? '' : styles[weight];
    const variantClass = styles[variant] || '';
    
    return `${styles.text} ${variantClass} ${fontWeight} ${className}`;
  };

  // For paragraph variant, use a p element
  if (variant === 'paragraph') {
    return (
      <p className={getClassName()} style={textStyle} {...rest}>
        {children}
      </p>
    );
  }

  // For title variant, use an h2 element
  if (variant === 'title') {
    return (
      <h2 className={getClassName()} style={textStyle} {...rest}>
        {children}
      </h2>
    );
  }

  // For subtitle variant, use an h3 element
  if (variant === 'subtitle') {
    return (
      <h3 className={getClassName()} style={textStyle} {...rest}>
        {children}
      </h3>
    );
  }

  // For all other variants, use a span
  return (
    <span className={getClassName()} style={textStyle} {...rest}>
      {children}
    </span>
  );
};

export default Text;