import React from 'react';
import { View, StyleSheet, Platform, Switch, TouchableOpacity } from 'react-native';
import { Text, useTheme as usePaperTheme } from 'react-native-paper';
import { useAuthContext } from '../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { createPlatformStyleSheet, spacing } from '../theme';
import { Row } from './layout';

// Create a simple AdminContext to avoid circular dependencies
export type AdminContextType = {
  isAdminMode: boolean;
  setIsAdminMode?: (value: boolean) => void;
};

// Initial context value
const defaultAdminContext: AdminContextType = {
  isAdminMode: false
};

// Create a context to be used in this component
export const AdminContext = React.createContext<AdminContextType>(defaultAdminContext);

// Hook to use the admin context
export const useAdminMode = () => {
  const context = React.useContext(AdminContext);
  // On iOS, always return isAdminMode as false regardless of actual state
  if (Platform.OS === 'ios') {
    return {
      ...context,
      isAdminMode: false,
      setIsAdminMode: undefined // Not needed on iOS
    };
  }
  return context;
};

const AppHeader = () => {
  // Use the paper theme
  const theme = usePaperTheme();
  
  // Get admin context
  const { isAdminMode, setIsAdminMode } = useAdminMode();
  
  // If iOS, don't show admin toggle
  const isIOS = Platform.OS === 'ios';
  
  // If web, always show header with admin toggle
  // If mobile, only show header in admin mode
  const shouldShowHeader = Platform.OS === 'web' || isAdminMode;
  
  if (!shouldShowHeader) {
    return null;
  }

  return (
    <View style={styles.header}>
      <Row justifyContent="space-between" alignItems="center">
        <Text style={[styles.title, { color: theme.colors.primary }]}>
          {isAdminMode ? 'Purpose Admin' : 'Purpose'}
        </Text>
        
        {/* Only show admin toggle on web, not on iOS */}
        {Platform.OS === 'web' && setIsAdminMode && (
          <Row alignItems="center">
            <Text style={styles.toggleLabel}>
              Admin Mode
            </Text>
            <Switch
              value={isAdminMode}
              onValueChange={(value) => setIsAdminMode(value)}
              trackColor={{ false: '#767577', true: theme.colors.primaryContainer }}
              thumbColor={isAdminMode ? theme.colors.primary : '#f4f3f4'}
            />
          </Row>
        )}
      </Row>
    </View>
  );
};

const styles = createPlatformStyleSheet({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  toggleLabel: {
    fontSize: 14,
    marginRight: 8,
    color: '#666',
  },
});

export default AppHeader;