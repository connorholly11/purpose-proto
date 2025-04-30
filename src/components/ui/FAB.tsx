import React from 'react';
import styles from './styles.module.css';

interface FABProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode | string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
  label?: string;
}

export const FAB: React.FC<FABProps> = ({
  icon,
  size = 'medium',
  color = '#007AFF',
  className = '',
  label,
  style,
  ...rest
}) => {
  const getSizeClassName = () => {
    return styles[`fab${size.charAt(0).toUpperCase() + size.slice(1)}`] || styles.fabMedium;
  };

  const fabStyle: React.CSSProperties = {
    backgroundColor: color,
    ...style,
  };

  return (
    <button
      className={`${styles.fab} ${getSizeClassName()} ${className}`}
      style={fabStyle}
      type="button"
      {...rest}
    >
      <span className={styles.fabIcon}>{icon}</span>
      {label && <span className={styles.fabLabel}>{label}</span>}
    </button>
  );
};

export default FAB;