import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useAuthContext } from '../context/AuthContext';
import { useAdminMode } from '../navigation/AppNavigator';
import { createPlatformStyleSheet, spacing } from '../theme';
import { Row } from './layout';

const AppHeader = () => {
  const { isAdminMode } = useAdminMode();
  const theme = useTheme();

  // Don't render if not in admin mode
  if (!isAdminMode) {
    return null;
  }

  return (
    <View style={styles.header}>
      <Row justifyContent="center" alignItems="center">
        <Text style={[styles.title, { color: theme.colors.primary }]}>
          Purpose Admin
        </Text>
      </Row>
    </View>
  );
};

const styles = createPlatformStyleSheet({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    paddingHorizontal: spacing.md,
    backgroundColor: '#F2F2F7',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CCCCCC',
    // Platform-specific header styling
    ios: {
      shadowColor: 'rgba(0,0,0,0.1)',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1,
    },
    android: {
      elevation: 2,
    },
    web: {
      boxShadow: '0px 1px 3px rgba(0,0,0,0.1)',
    },
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AppHeader;