import React from 'react';
import styles from './Layout.module.css';

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: number;
  className?: string;
  children: React.ReactNode;
}

/**
 * A surface component that replaces React Native Paper's Surface
 */
export const Surface: React.FC<SurfaceProps> = ({
  elevation = 1,
  className = '',
  children,
  style,
  ...rest
}) => {
  const surfaceStyle = {
    boxShadow: elevation > 0 ? `0px ${elevation * 0.5}px ${elevation * 2}px rgba(0,0,0,0.1)` : 'none',
    ...(style as React.CSSProperties),
  };

  return (
    <div className={`${styles.surface} ${className}`} style={surfaceStyle} {...rest}>
      {children}
    </div>
  );
};

export default Surface;