import React from 'react';
import { View, StyleSheet, Platform, Switch } from 'react-native';
import { Text, useTheme as usePaperTheme, Button } from 'react-native-paper';
import { useAuthContext } from '../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { createPlatformStyleSheet, spacing } from '../theme';
import { Row } from './layout';
import { useNavigation, useRoute } from '@react-navigation/native';

// Create a simple AdminContext to avoid circular dependencies
export type AdminContextType = {
  isAdminMode: boolean;
  setIsAdminMode?: (value: boolean) => void;
  // New field to track if we're in the admin section
  isAdminSection?: boolean;
};

// Initial context value
const defaultAdminContext: AdminContextType = {
  isAdminMode: false,
  isAdminSection: false
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
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get admin context - now includes isAdminSection and setIsAdminMode
  const { isAdminMode, setIsAdminMode, isAdminSection } = useAdminMode();
  
  // If iOS, don't show header
  if (Platform.OS === 'ios') {
    return null;
  }

  const navigateToAdmin = () => {
    if (Platform.OS === 'web') {
      // @ts-ignore - navigate to the path-based route
      navigation.navigate("AdminRoot");
    }
  };

  const navigateToUser = () => {
    if (Platform.OS === 'web') {
      // @ts-ignore - navigate to the path-based route
      navigation.navigate("UserRoot");
    }
  };

  return (
    <View style={styles.header}>
      <Row justifyContent="space-between" alignItems="center">
        <Text style={[styles.title, { color: theme.colors.primary }]}>
          {isAdminMode ? 'Purpose Admin' : 'Purpose'}
        </Text>
        
        <Row alignItems="center" style={styles.navigationLinks}>
          {/* Only show toggle in admin section */}
          {isAdminSection && setIsAdminMode && (
            <Row alignItems="center" style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>User View</Text>
              <Switch
                value={isAdminMode}
                onValueChange={(value) => {
                  if (setIsAdminMode) {
                    setIsAdminMode(value);
                  }
                }}
                trackColor={{ false: '#767577', true: theme.colors.primaryContainer }}
                thumbColor={isAdminMode ? theme.colors.primary : '#f4f3f4'}
              />
              <Text style={styles.toggleLabel}>Admin View</Text>
            </Row>
          )}
          
          {/* Navigation buttons on web */}
          {Platform.OS === 'web' && (
            <>
              <Button 
                mode="text" 
                onPress={navigateToUser}
                style={styles.navButton}
              >
                User
              </Button>
              <Button 
                mode="text" 
                onPress={navigateToAdmin}
                style={styles.navButton}
              >
                Admin
              </Button>
            </>
          )}
        </Row>
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
  navigationLinks: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    marginHorizontal: 4,
  },
  toggleContainer: {
    marginRight: 16,
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  toggleLabel: {
    fontSize: 14,
    marginHorizontal: 8,
    color: '#666',
  }
});

export default AppHeader;