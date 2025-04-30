import React from 'react';
import styles from './Layout.module.css';

interface FABProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  size?: 'small' | 'medium' | 'large';
  color?: string; 
  className?: string;
}

/**
 * A floating action button component that replaces React Native Paper's FAB
 */
export const FAB: React.FC<FABProps> = ({
  icon,
  size = 'medium',
  color = '#007AFF',
  className = '',
  style,
  ...rest
}) => {
  const sizeMap = {
    small: { button: 40, icon: 20 },
    medium: { button: 56, icon: 24 },
    large: { button: 72, icon: 36 },
  };

  const dimensions = sizeMap[size] || sizeMap.medium;

  const fabStyle = {
    width: `${dimensions.button}px`,
    height: `${dimensions.button}px`,
    backgroundColor: color,
    ...(style as React.CSSProperties),
  };

  const iconStyle = {
    fontSize: `${dimensions.icon}px`,
  };

  const fabClassName = `${styles.fab} ${styles[`fab${size.charAt(0).toUpperCase() + size.slice(1)}`] || ''} ${className}`;

  return (
    <button
      className={fabClassName}
      style={fabStyle}
      aria-label={icon}
      {...rest}
    >
      <span className={styles.fabIcon} style={iconStyle}>
        {/* 
          For simplicity, we're just displaying the icon name - in a real implementation, 
          you would use an icon library like Font Awesome, Material Icons, etc.
        */}
        {icon === 'chevron-down' ? '↓' : icon}
      </span>
    </button>
  );
};

export default FAB;