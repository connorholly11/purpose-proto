import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

type IosHeaderProps = {
  onProfilePress: () => void;
  onNewChatPress: () => void;
};

export const IosHeader = ({ onProfilePress, onNewChatPress }: IosHeaderProps) => {
  const theme = useTheme();
  
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onProfilePress}>
        <MaterialIcons name="person-outline" size={24} color={theme.colors.primary} />
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
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
});

export default IosHeader;