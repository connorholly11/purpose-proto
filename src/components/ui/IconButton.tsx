import React from 'react';
import styles from './styles.module.css';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode | string;
  size?: number;
  mode?: 'default' | 'contained' | 'outlined';
  color?: string;
  disabled?: boolean;
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = 24,
  mode = 'default',
  color = '#000',
  disabled = false,
  className = '',
  style,
  ...rest
}) => {
  const getButtonClassName = () => {
    const modeClass = mode !== 'default' ? styles[`iconButton${mode.charAt(0).toUpperCase() + mode.slice(1)}`] : '';
    const disabledClass = disabled ? styles.iconButtonDisabled : '';
    
    return `${styles.iconButton} ${modeClass} ${disabledClass} ${className}`;
  };

  const buttonStyle: React.CSSProperties = {
    width: size * 1.5,
    height: size * 1.5,
    color: mode === 'contained' ? '#fff' : color,
    backgroundColor: mode === 'contained' ? color : undefined,
    borderColor: mode === 'outlined' ? color : undefined,
    ...style,
  };

  return (
    <button
      className={getButtonClassName()}
      style={buttonStyle}
      disabled={disabled}
      type="button"
      {...rest}
    >
      <span className={styles.iconButtonIcon} style={{ fontSize: size }}>
        {icon}
      </span>
    </button>
  );
};

export default IconButton;