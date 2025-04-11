# Cross-Platform Styling System

This document outlines the cross-platform styling approach for the application, designed to maintain consistent UI across web and mobile platforms (iOS and Android) while minimizing platform-specific code.

## Key Components

### 1. Theme Configuration
Located in `src/theme/theme.ts`, this defines our app's design system:
- **Colors**: Brand colors, UI elements colors
- **Typography**: Font families, weights, and sizes 
- **Spacing**: Consistent spacing scale
- **Roundness**: Border radius values

### 2. Platform Utilities
Located in `src/theme/platformUtils.ts`, these utilities help handle platform differences:
- **platformSelect**: Function for platform-specific values
- **createPlatformStyleSheet**: Creates stylesheets with platform-specific styles
- **spacing**: Standard spacing values
- **getShadow**: Cross-platform shadow implementation

### 3. Shadow Utilities
Located in `src/theme/shadows.ts`:
- **createShadow**: Creates consistent shadows across platforms
- **shadows**: Predefined shadow styles for different elevations
- **createColoredShadow**: For creating colored shadows

### 4. Layout Components
Located in `src/components/layout/`:
- **Row**: Horizontal layout with consistent spacing
- **Column**: Vertical layout with consistent spacing
- **Section**: Container with optional elevation and title
- **Card**: Wrapper for React Native Paper's Card component

## Usage Guidelines

### Using Theme
```tsx
import { useTheme } from 'react-native-paper';

const MyComponent = () => {
  const theme = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.primary }}>
        Themed Text
      </Text>
    </View>
  );
};
```

### Using Layout Components
```tsx
import { Row, Column, Card, Section } from '../components';

const MyComponent = () => {
  return (
    <Column spacing="md">
      <Section title="My Section" elevated>
        <Row spacing="sm" alignItems="center">
          <Icon name="star" />
          <Text>Row with consistent spacing</Text>
        </Row>
      </Section>
      
      <Card title="My Card" elevation={2}>
        <Text>Card content</Text>
      </Card>
    </Column>
  );
};
```

### Platform-Specific Styles
```tsx
import { createPlatformStyleSheet } from '../theme';

const styles = createPlatformStyleSheet({
  container: {
    // Shared styles
    padding: 16,
    backgroundColor: 'white',
    
    // Platform-specific styles
    ios: {
      shadowColor: 'black',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
    web: {
      boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
    },
  },
});
```

### Using Shadows
```tsx
import { shadows } from '../theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    ...shadows.card, // Adds platform-specific shadows
  },
});
```

## Best Practices

1. **Use React Native Paper components** when possible for consistent UI elements
2. **Use layout components** for consistent spacing and structure
3. **Use theme values** instead of hardcoded colors, spacing, etc.
4. **Centralize platform differences** in style utilities instead of using inline Platform.OS checks
5. **Use createPlatformStyleSheet** for components with significant platform differences
6. **Keep platform-specific code minimal** by using the provided utilities
7. **Avoid platform-specific files** (.ios.js, .web.js) when possible - use the styling system instead
8. **Use the theme's typography styles** for consistent text across platforms

## Example Component
See `src/components/CrossPlatformExample.tsx` for a comprehensive example of using the cross-platform styling system.

## When to Use Platform-Specific Files

In rare cases, you might need more significant platform differences. When the styling system isn't enough, you can use platform-specific files:

- `Component.tsx` - Shared code
- `Component.ios.tsx` - iOS-specific implementation  
- `Component.android.tsx` - Android-specific implementation
- `Component.web.tsx` - Web-specific implementation

React Native will automatically use the correct version based on platform.