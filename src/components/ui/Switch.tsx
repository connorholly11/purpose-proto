import React from 'react';
import styles from './styles.module.css';

interface SwitchProps {
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
  trackColor?: {
    false: string;
    true: string;
  };
  thumbColor?: string;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  value = false,
  onValueChange,
  disabled = false,
  trackColor = { false: '#767577', true: '#007AFF' },
  thumbColor = '#FFFFFF',
  className = '',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onValueChange) {
      onValueChange(e.target.checked);
    }
  };

  return (
    <label 
      className={`${styles.switch} ${className}`}
      style={{ 
        '--track-color-off': trackColor.false,
        '--track-color-on': trackColor.true,
        '--thumb-color': thumbColor,
      } as React.CSSProperties}
    >
      <input 
        type="checkbox"
        className={styles.switchInput}
        checked={value}
        onChange={handleChange}
        disabled={disabled}
      />
      <div className={styles.switchTrack}>
        <div className={styles.switchThumb}></div>
      </div>
    </label>
  );
};

export default Switch;