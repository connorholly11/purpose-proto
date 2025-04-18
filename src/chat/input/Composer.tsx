import React from 'react';
import { View, TextInput, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { Surface, IconButton } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { getThemeColors } from '../styles';
import { createPlatformStyleSheet, spacing, createShadow, platformSelect } from '../../theme';

type ComposerProps = {
  inputText: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onKeyPress?: (e: any) => void;
  loading: boolean;
  platform: 'ios' | 'android' | 'web';
};

export const Composer = ({
  inputText,
  onChangeText,
  onSend,
  onKeyPress,
  loading,
  platform,
}: ComposerProps) => {
  const theme = useTheme();
  const COLORS = getThemeColors(theme);
  const isIOS = platform === 'ios';

  return (
    <View style={styles.inputContainer}>
      {isIOS ? (
        <>
          <TextInput 
            style={styles.input}
            placeholder="Message"
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={onChangeText}
            onSubmitEditing={onSend}
            multiline
          />
          
          {!inputText.trim() ? (
            <TouchableOpacity style={styles.mediaButton} onPress={() => console.log('Microphone tapped')}>
              <MaterialIcons name="mic" size={24} color="#999" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
              onPress={onSend}
              disabled={loading}
            >
              <MaterialIcons name="send" size={20} color="white" />
            </TouchableOpacity>
          )}
        </>
      ) : (
        <>
          <Surface style={[styles.inputSurface, { backgroundColor: '#FFFFFF' }]} elevation={1}>
            <TextInput
              style={[styles.input, { backgroundColor: COLORS.inputBackground }]}
              placeholder="Message"
              value={inputText}
              onChangeText={onChangeText}
              multiline
              disabled={loading}
              onKeyPress={onKeyPress}
              onSubmitEditing={onSend}
              blurOnSubmit={false}
            />
          </Surface>
          <IconButton
            icon="arrow-up"
            mode="contained"
            containerColor={COLORS.sendButton}
            iconColor="#FFFFFF"
            size={22}
            onPress={onSend}
            disabled={!inputText.trim() || loading}
            style={styles.sendButton}
          />
        </>
      )}
    </View>
  );
};

const styles = createPlatformStyleSheet({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Platform.OS === 'ios' ? 12 : spacing.md,
    paddingBottom: platformSelect({
      ios: 12,
      android: spacing.lg,
      default: spacing.md
    }),
    backgroundColor: Platform.OS === 'ios' ? 'white' : 'transparent',
    borderTopWidth: Platform.OS === 'ios' ? 1 : 0,
    borderTopColor: '#e0e0e0',
  },
  inputSurface: {
    flex: 1,
    borderRadius: 20, // More rounded corners like iMessage
    marginRight: spacing.sm,
    overflow: 'hidden',
    ...createShadow(1),
  },
  input: {
    flex: 1,
    backgroundColor: Platform.OS === 'ios' ? '#f5f5f5' : undefined,
    borderRadius: 20,
    paddingHorizontal: Platform.OS === 'ios' ? 16 : undefined,
    paddingVertical: Platform.OS === 'ios' ? 10 : undefined,
    marginHorizontal: Platform.OS === 'ios' ? 8 : 0,
    fontSize: 16,
    maxHeight: 120,
  },
  mediaButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    borderRadius: 20, // Perfect circle
    width: 36, // iMessage has a smaller send button
    height: 36, // iMessage has a smaller send button
    margin: 2,
    justifyContent: 'center',
    alignItems: 'center',
    ...createShadow(2),
  },
});

export default Composer;