import React from 'react';
import styles from './styles.module.css';

interface SurfaceProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  elevation?: number;
}

export const Surface: React.FC<SurfaceProps> = ({
  children,
  style,
  className = '',
  elevation = 1,
}) => {
  const surfaceStyle: React.CSSProperties = {
    ...style,
    boxShadow: elevation ? `0 ${elevation}px ${elevation * 2}px rgba(0,0,0,0.1)` : undefined,
  };

  return (
    <div className={`${styles.surface} ${className}`} style={surfaceStyle}>
      {children}
    </div>
  );
};

export default Surface;