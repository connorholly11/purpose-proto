import React from 'react';
import styles from './Layout.module.css';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  size?: number;
  mode?: 'outlined' | 'contained';
  containerColor?: string;
  iconColor?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * An icon button component that replaces React Native Paper's IconButton
 */
export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = 24,
  mode = 'outlined',
  containerColor = 'transparent',
  iconColor = '#000000',
  disabled = false,
  className = '',
  style,
  ...rest
}) => {
  const buttonClassName = `
    ${styles.iconButton} 
    ${styles[`iconButton${mode.charAt(0).toUpperCase() + mode.slice(1)}`] || ''} 
    ${disabled ? styles.iconButtonDisabled : ''} 
    ${className}
  `;

  const buttonStyle = {
    width: size * 1.5,
    height: size * 1.5,
    backgroundColor: mode === 'contained' ? containerColor : 'transparent',
    borderColor: mode === 'outlined' ? containerColor : 'transparent',
    ...(style as React.CSSProperties),
  };

  const iconStyle = {
    color: iconColor,
    fontSize: size,
  };

  return (
    <button
      className={buttonClassName}
      style={buttonStyle}
      disabled={disabled}
      aria-label={icon}
      {...rest}
    >
      <span className={styles.iconButtonIcon} style={iconStyle}>
        {/* 
          For simplicity, we're just displaying the icon name - in a real implementation, 
          you would use an icon library like Font Awesome, Material Icons, etc.
        */}
        {icon === 'arrow-up' ? '↑' : icon}
      </span>
    </button>
  );
};

export default IconButton;