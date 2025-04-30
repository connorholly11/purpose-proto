import { spacing } from './utils';

/**
 * Creates a card style with consistent styling across the app
 */
export const createCardStyle = (elevation: number = 1) => ({
  padding: spacing.md,
  marginBottom: spacing.md,
  backgroundColor: '#ffffff',
  borderRadius: 8,
  boxShadow: `0px ${elevation * 0.5}px ${elevation * 2}px rgba(0,0,0,0.1)`,
});

/**
 * Creates button styles with consistent styling
 */
export const createButtonStyle = (variant: 'primary' | 'secondary' | 'outline' | 'text' = 'primary') => {
  const baseStyle = {
    borderRadius: 8,
    padding: `${spacing.sm}px ${spacing.md}px`,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    outline: 'none',
  };
  
  switch (variant) {
    case 'primary':
      return {
        ...baseStyle,
        backgroundColor: 'var(--primary-color, #007AFF)',
        color: '#ffffff',
      };
    case 'secondary':
      return {
        ...baseStyle,
        backgroundColor: 'var(--primary-color, #007AFF) + 20', // 20% opacity
        color: 'var(--primary-color, #007AFF)',
      };
    case 'outline':
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
        color: 'var(--primary-color, #007AFF)',
        border: '1px solid var(--primary-color, #007AFF)',
      };
    case 'text':
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
        color: 'var(--primary-color, #007AFF)',
        padding: 0,
      };
  }
};

/**
 * Creates input field styles with consistent styling
 */
export const createInputStyle = (variant: 'outline' | 'filled' = 'outline') => {
  const baseStyle = {
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 16,
    width: '100%',
    transition: 'all 0.2s ease',
  };
  
  switch (variant) {
    case 'outline':
      return {
        ...baseStyle,
        border: '1px solid #CCCCCC',
        backgroundColor: 'transparent',
      };
    case 'filled':
      return {
        ...baseStyle,
        border: 'none',
        backgroundColor: '#F5F5F5',
      };
  }
};

/**
 * Creates text styles with consistent styling
 */
export const createTextStyle = (variant: 'h1' | 'h2' | 'h3' | 'body' | 'caption' = 'body') => {
  switch (variant) {
    case 'h1':
      return {
        fontSize: 28,
        fontWeight: 700,
        marginBottom: spacing.md,
      };
    case 'h2':
      return {
        fontSize: 24,
        fontWeight: 600,
        marginBottom: spacing.sm,
      };
    case 'h3':
      return {
        fontSize: 20,
        fontWeight: 600,
        marginBottom: spacing.sm,
      };
    case 'body':
      return {
        fontSize: 16,
        fontWeight: 400,
        lineHeight: 1.5,
      };
    case 'caption':
      return {
        fontSize: 14,
        fontWeight: 400,
        color: '#666666',
      };
  }
};