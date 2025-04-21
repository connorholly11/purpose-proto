import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Avatar, useTheme } from 'react-native-paper';
import { useClerkAvatar } from '../../hooks/useClerkAvatar';

type IosHeaderProps = {
  onProfilePress: () => void;
  onNewChatPress: () => void;
};

export const IosHeader = ({ onProfilePress, onNewChatPress }: IosHeaderProps) => {
  const theme = useTheme();
  const { imageUrl, initials } = useClerkAvatar();
  
  return (
    <View style={styles.header}>
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
      <TouchableOpacity onPress={onNewChatPress}>
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
    backgroundColor: '#f5f5f5',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  avatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default IosHeader;