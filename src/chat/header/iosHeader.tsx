import React, { useContext } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Avatar, useTheme } from 'react-native-paper';
import { useAdmin } from '../../context/AdminContext';
import { AdminContext } from '../../navigation/AppNavigator';
import { useClerkAvatar } from '../../hooks/useClerkAvatar';

type IosHeaderProps = {
  onProfilePress: () => void;
  onNewChatPress: () => void;
  onFeedbackPress?: () => void;
};

export const IosHeader = ({ onProfilePress, onNewChatPress, onFeedbackPress }: IosHeaderProps) => {
  const theme = useTheme();
  const { imageUrl, initials } = useClerkAvatar();
  const { unlocked } = useAdmin();
  const { isAdmin, toggleAdmin } = useContext(AdminContext);
  
  return (
    <View style={[styles.header, { 
      backgroundColor: theme.colors.surfaceHeader,
      borderBottomColor: theme.colors.outline
    }]}>
      <TouchableOpacity onPress={onProfilePress} style={styles.avatarContainer}>
        {imageUrl ? (
          <Avatar.Image size={28} source={{ uri: imageUrl }} />
        ) : (
          <Avatar.Text 
            size={28} 
            label={initials} 
            style={{ backgroundColor: theme.colors.primaryContainer }} 
            labelStyle={{ color: theme.colors.onPrimaryContainer, fontSize: 14 }}
          />
        )}
      </TouchableOpacity>
      <View style={{flex: 1}}/>
      {unlocked && (
        <TouchableOpacity 
          onPress={() => {
            console.log('Admin toggle pressed, current state:', isAdmin);
            toggleAdmin();
          }} 
          style={[
            styles.adminButton, 
            { 
              backgroundColor: isAdmin ? theme.colors.primary : 'transparent',
              borderColor: theme.colors.primary
            }
          ]}
        >
          <Text 
            style={{ 
              fontSize: 14, 
              fontWeight: 'bold',
              color: isAdmin ? 'white' : theme.colors.primary 
            }}
          >
            A
          </Text>
        </TouchableOpacity>
      )}
      {onFeedbackPress && (
        <TouchableOpacity onPress={onFeedbackPress} style={styles.iconButton}>
          <MaterialIcons name="construction" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={onNewChatPress} style={styles.iconButton}>
        <MaterialIcons name="add" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 12,
  },
  adminButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});

export default IosHeader;