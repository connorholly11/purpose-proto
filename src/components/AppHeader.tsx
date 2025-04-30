import React from 'react';
import { useAuthContext } from '../context/AuthContext';
import styles from './AppHeader.module.css';
import Row from './ui/Row';
import Text from './ui/Text';
import Switch from './ui/Switch';

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
  return React.useContext(AdminContext);
};

const AppHeader = () => {
  // Get admin context
  const { isAdminMode, setIsAdminMode } = useAdminMode();
  
  return (
    <header className={styles.header}>
      <Row justifyContent="space-between" alignItems="center">
        <Text 
          variant="title"
          style={{ color: '#007AFF' }}
        >
          {isAdminMode ? 'Purpose Admin' : 'Purpose'}
        </Text>
        
        {/* Admin toggle */}
        {setIsAdminMode && (
          <Row alignItems="center">
            <Text 
              variant="label" 
              className={styles.toggleLabel}
            >
              Admin Mode
            </Text>
            <Switch
              value={isAdminMode}
              onValueChange={(value) => setIsAdminMode(value)}
              trackColor={{ false: '#767577', true: '#D1E5FF' }}
              thumbColor={isAdminMode ? '#007AFF' : '#f4f3f4'}
            />
          </Row>
        )}
      </Row>
    </header>
  );
};

export default AppHeader;