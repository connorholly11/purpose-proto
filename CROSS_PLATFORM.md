# Cross-Platform UI Implementation

This document outlines the cross-platform styling approach we've implemented in the app, designed to maintain consistent UI across web and mobile platforms (iOS and Android) while minimizing platform-specific code.

## Overview

We've created a comprehensive styling system that:

1. **Centralizes platform-specific styling** in utility functions rather than scattered across components
2. **Leverages React Native Paper** for consistent UI components
3. **Provides layout components** for consistent spacing and structure
4. **Implements testing tools** to verify cross-platform consistency

## Directory Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── animations/     # Animation components
│   │   ├── dashboard/      # Dashboard-specific components
│   │   ├── layout/         # Layout components (Row, Column, etc.)
│   │   └── CrossPlatformExample.tsx  # Example component showing best practices
│   ├── theme/
│   │   ├── index.ts        # Central export for all theme utilities
│   │   ├── platformUtils.ts # Platform-specific utilities
│   │   ├── shadows.ts      # Cross-platform shadow implementation
│   │   ├── testUtils.ts    # Testing utilities for platform consistency
│   │   ├── theme.ts        # Theme configuration
│   │   └── README.md       # Documentation for the theme system
│   └── tests/
│       ├── setupTests.ts   # Test setup for cross-platform testing
│       ├── snapshot.test.tsx # Snapshot tests for UI components
│       └── platformConsistency.test.ts # Tests for platform consistency
└── scripts/
    └── find-platform-checks.js # Script to find direct Platform.OS usages
```

## Key Features

### 1. Theme Configuration
Located in `src/theme/theme.ts`, this defines our app's design system:
- Colors: Brand colors and UI element colors
- Typography: Font families, weights, and sizes
- Spacing: Consistent spacing scale
- Roundness: Border radius values

```tsx
// Example usage
import { useTheme } from 'react-native-paper';

function MyComponent() {
  const theme = useTheme();
  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.primary }}>Themed Text</Text>
    </View>
  );
}
```

### 2. Platform Utilities
Located in `src/theme/platformUtils.ts`, these utilities help handle platform differences:

```tsx
import { platformSelect, createPlatformStyleSheet, spacing } from '../theme';

// Select platform-specific values
const paddingValue = platformSelect({
  ios: 20,
  android: 16,
  web: 16,
  default: 16,
});

// Create platform-specific stylesheets
const styles = createPlatformStyleSheet({
  container: {
    padding: spacing.md,
    // Platform-specific overrides
    ios: {
      shadowColor: 'rgba(0,0,0,0.2)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
    },
    android: {
      elevation: 4,
    },
    web: {
      boxShadow: '0px 2px 8px rgba(0,0,0,0.15)',
    },
  },
});
```

### 3. Shadow Utilities
Located in `src/theme/shadows.ts`:

```tsx
import { createShadow, shadows } from '../theme';

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    ...shadows.card, // Adds platform-specific shadows
  },
  customShadow: {
    ...createShadow(3), // Custom shadow with elevation level 3
  },
});
```

### 4. Layout Components
Located in `src/components/layout/`:

```tsx
import { Row, Column, Card, Section } from '../components';

function MyComponent() {
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
}
```

## Testing

### 1. Snapshot Testing
We use snapshot testing to verify component appearance across platforms:

```bash
# Run snapshot tests
npm run test:snapshot
```

### 2. Platform Consistency Testing
We test for platform-specific code and ensure it's managed properly:

```bash
# Run platform consistency tests
npm run test:platform
```

### 3. Platform Check Linting
We have a script to find direct Platform.OS usages that should be refactored:

```bash
# Find direct Platform.OS usages
npm run lint:platform
```

## Guidelines for Cross-Platform Development

1. **Use React Native Paper components** when possible for consistent UI elements
2. **Use layout components** for consistent spacing and structure
3. **Use theme values** instead of hardcoded colors, spacing, etc.
4. **Centralize platform differences** in style utilities instead of using inline Platform.OS checks
5. **Use createPlatformStyleSheet** for components with significant platform differences
6. **Keep platform-specific code minimal** by using the provided utilities
7. **Avoid platform-specific files** (.ios.js, .web.js) when possible - use the styling system instead
8. **Use the theme's typography styles** for consistent text across platforms

## Example Component

See `src/components/CrossPlatformExample.tsx` for a comprehensive example of the cross-platform styling system.

## Future Improvements

1. Expand snapshot testing to cover more components
2. Create custom ESLint rule to detect direct Platform.OS usage
3. Add more comprehensive visual regression testing
4. Further standardize navigation appearance across platforms