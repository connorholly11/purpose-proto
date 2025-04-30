import React from 'react';
import styles from './styles.module.css';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  mode?: 'flat' | 'outlined';
  label?: string;
  error?: string | boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  multiline?: boolean;
  rows?: number;
  className?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  mode = 'outlined',
  label,
  error,
  leftIcon,
  rightIcon,
  multiline = false,
  rows = 3,
  className = '',
  disabled = false,
  ...rest
}) => {
  const getInputClassName = () => {
    const modeClass = styles[`textInput${mode.charAt(0).toUpperCase() + mode.slice(1)}`] || '';
    const errorClass = error ? styles.textInputError : '';
    const disabledClass = disabled ? styles.textInputDisabled : '';
    
    return `${styles.textInput} ${modeClass} ${errorClass} ${disabledClass} ${className}`;
  };

  const Component = multiline ? 'textarea' : 'input';
  const multilineProps = multiline ? { rows } : {};

  return (
    <div className={styles.textInputContainer}>
      {label && (
        <label 
          className={`${styles.textInputLabel} ${error ? styles.textInputLabelError : ''}`}
        >
          {label}
        </label>
      )}
      <div className={styles.textInputWrapper}>
        {leftIcon && (
          <div className={styles.textInputLeft}>
            <span className={styles.textInputIcon}>{leftIcon}</span>
          </div>
        )}
        <Component 
          className={getInputClassName()}
          disabled={disabled}
          style={{
            paddingLeft: leftIcon ? '36px' : undefined,
            paddingRight: rightIcon ? '36px' : undefined,
          }}
          {...multilineProps}
          {...rest}
        />
        {rightIcon && (
          <div className={styles.textInputRight}>
            <span className={styles.textInputIcon}>{rightIcon}</span>
          </div>
        )}
      </div>
      {typeof error === 'string' && error && (
        <div className={styles.textInputLabelError}>{error}</div>
      )}
    </div>
  );
};

export default TextInput;