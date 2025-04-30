import React from 'react';
import styles from './Layout.module.css';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  mode?: 'flat' | 'outlined';
  label?: string;
  error?: boolean;
  multiline?: boolean;
  rows?: number;
  left?: React.ReactNode;
  right?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  outlineStyle?: React.CSSProperties;
  theme?: { colors: { primary: string } };
}

/**
 * A text input component that replaces React Native Paper's TextInput
 */
export const TextInput: React.FC<TextInputProps> = ({
  mode = 'flat',
  label,
  error = false,
  multiline = false,
  rows = 3,
  left,
  right,
  disabled = false,
  className = '',
  outlineStyle,
  theme,
  style,
  ...rest
}) => {
  const inputClassName = `
    ${styles.textInput} 
    ${styles[`textInput${mode.charAt(0).toUpperCase() + mode.slice(1)}`] || ''} 
    ${error ? styles.textInputError : ''} 
    ${disabled ? styles.textInputDisabled : ''} 
    ${className}
  `;

  const inputStyle = {
    ...(theme?.colors?.primary && { '--primary-color': theme.colors.primary }),
    ...(style as React.CSSProperties),
  };

  const inputContainerStyle = {
    ...(outlineStyle || {}),
  };

  const renderInput = () => {
    if (multiline) {
      return (
        <textarea
          className={inputClassName}
          style={inputStyle}
          rows={rows}
          disabled={disabled}
          {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      );
    }

    return (
      <input
        className={inputClassName}
        style={inputStyle}
        disabled={disabled}
        {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
      />
    );
  };

  return (
    <div className={styles.textInputContainer} style={inputContainerStyle}>
      {label && (
        <label className={`${styles.textInputLabel} ${error ? styles.textInputLabelError : ''}`}>
          {label}
        </label>
      )}
      <div className={styles.textInputWrapper}>
        {left && <div className={styles.textInputLeft}>{left}</div>}
        {renderInput()}
        {right && <div className={styles.textInputRight}>{right}</div>}
      </div>
    </div>
  );
};

// Add an Icon helper component
TextInput.Icon = ({ icon, size = 24 }: { icon: string; size?: number }) => (
  <span 
    className={`${styles.textInputIcon} ${icon === 'loading' ? styles.textInputIconLoading : ''}`} 
    style={{ width: size, height: size }}
  >
    {icon === 'loading' ? '⟳' : icon}
  </span>
);

export default TextInput;