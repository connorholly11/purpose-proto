import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Avatar, useTheme } from 'react-native-paper';
import { useClerkAvatar } from '../../hooks/useClerkAvatar';

type IosHeaderProps = {
  onProfilePress: () => void;
  onNewChatPress: () => void;
  onFeedbackPress?: () => void;
};

export const IosHeader = ({ onProfilePress, onNewChatPress, onFeedbackPress }: IosHeaderProps) => {
  const theme = useTheme();
  const { imageUrl, initials } = useClerkAvatar();
  
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
});

export default IosHeader;