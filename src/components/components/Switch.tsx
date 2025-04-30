import React from 'react';
import styles from './Layout.module.css';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  trackColor?: { false: string; true: string };
  thumbColor?: string;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * A switch component that replaces React Native's Switch
 */
export const Switch: React.FC<SwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
  trackColor = { false: '#767577', true: '#007AFF' },
  thumbColor = '#FFFFFF',
  style,
  className = '',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange(e.target.checked);
  };

  const switchStyle = {
    '--track-color-off': trackColor.false,
    '--track-color-on': trackColor.true,
    '--thumb-color': thumbColor,
    ...(style as React.CSSProperties),
  } as React.CSSProperties;

  return (
    <label className={`${styles.switch} ${className}`} style={switchStyle}>
      <input
        type="checkbox"
        checked={value}
        onChange={handleChange}
        disabled={disabled}
        className={styles.switchInput}
      />
      <span className={styles.switchTrack}>
        <span className={styles.switchThumb} />
      </span>
    </label>
  );
};

export default Switch;