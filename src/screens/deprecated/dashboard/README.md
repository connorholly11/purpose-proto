# Deprecated Dashboard Components

This directory contains dashboard screens that have been deprecated in the application.

## Reason for Deprecation

The Dashboard tab was removed from the admin navigation as part of code consolidation efforts. The functionality was largely duplicated by other tabs (particularly Quests) and was removed to simplify the UI navigation.

## Original Usage

Previously, the Dashboard tab was available in the admin section as:

```jsx
<AdminTabs.Screen
  name="Dashboard"
  component={QuestsScreen} // Originally PlaceholderDashboardScreen
  options={{ title: 'Dashboard' }}
/>
```

The functionality is now consolidated with other screens in the application.