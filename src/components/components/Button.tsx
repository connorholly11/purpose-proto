import React from 'react';
import styles from './Layout.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  mode?: 'text' | 'outlined' | 'contained';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  color?: string;
  textColor?: string;
  compact?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * A button component that replaces React Native Paper's Button
 */
export const Button: React.FC<ButtonProps> = ({
  mode = 'contained',
  icon,
  loading = false,
  disabled = false,
  color = '#007AFF',
  textColor,
  compact = false,
  className = '',
  children,
  style,
  ...rest
}) => {
  const getButtonClassName = () => {
    const modeClass = styles[`button${mode.charAt(0).toUpperCase() + mode.slice(1)}`] || '';
    const sizeClass = compact ? styles.buttonCompact : '';
    const loadingClass = loading ? styles.buttonLoading : '';
    
    return `${styles.button} ${modeClass} ${sizeClass} ${loadingClass} ${className}`;
  };

  const buttonStyle = {
    ...(mode === 'contained' && { backgroundColor: color }),
    ...(mode === 'outlined' && { borderColor: color, color }),
    ...(mode === 'text' && { color }),
    ...(textColor && { color: textColor }),
    ...(style as React.CSSProperties),
  };

  return (
    <button
      className={getButtonClassName()}
      style={buttonStyle}
      disabled={disabled || loading}
      {...rest}
    >
      {icon && <span className={styles.buttonIcon}>{icon}</span>}
      {loading ? <span className={styles.buttonSpinner}></span> : null}
      <span className={styles.buttonLabel}>{children}</span>
    </button>
  );
};

export default Button;