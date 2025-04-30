import React from 'react';
import styles from './Layout.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  elevation?: number;
  onPress?: () => void;
  contentStyle?: React.CSSProperties;
  children: React.ReactNode;
}

/**
 * A consistent card component that replaces React Native Paper's Card
 * and handles web-specific styling
 */
export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  elevation = 1,
  onPress,
  style,
  contentStyle,
  children,
  ...rest
}) => {
  const cardStyle = {
    boxShadow: `0px ${elevation * 0.5}px ${elevation * 2}px rgba(0,0,0,0.1)`,
    ...(style as React.CSSProperties),
  };

  const handleClick = () => {
    if (onPress) {
      onPress();
    }
  };

  return (
    <div 
      className={styles.card} 
      style={cardStyle} 
      onClick={onPress ? handleClick : undefined}
      role={onPress ? 'button' : undefined}
      tabIndex={onPress ? 0 : undefined}
      {...rest}
    >
      {(title || subtitle) && (
        <div className={styles.cardHeader}>
          {title && <h3 className={styles.cardTitle}>{title}</h3>}
          {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
        </div>
      )}
      <div className={styles.cardContent} style={contentStyle}>
        {children}
      </div>
    </div>
  );
};

export default Card;