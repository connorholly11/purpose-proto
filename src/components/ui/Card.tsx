import React from 'react';
import styles from './styles.module.css';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  style?: React.CSSProperties;
  className?: string;
  elevation?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  style,
  className = '',
  elevation = 1,
}) => {
  const cardStyle: React.CSSProperties = {
    ...style,
    boxShadow: elevation ? `0 ${elevation}px ${elevation * 2}px rgba(0,0,0,0.1)` : undefined,
  };

  return (
    <div className={`${styles.card} ${className}`} style={cardStyle}>
      {(title || subtitle) && (
        <div className={styles.cardHeader}>
          {title && <h3 className={styles.cardTitle}>{title}</h3>}
          {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
        </div>
      )}
      <div className={styles.cardContent}>
        {children}
      </div>
    </div>
  );
};

export default Card;