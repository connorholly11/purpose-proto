import React, { useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Platform, StyleSheet, ActivityIndicator } from 'react-native';
import { Surface, IconButton } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme as usePaperTheme } from 'react-native-paper';
import { getThemeColors } from '../styles';
import { createPlatformStyleSheet, spacing, createShadow, platformSelect } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
// import useSpeechRecognition from '../../hooks/useSpeechRecognition';

type ComposerProps = {
  inputText: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onKeyPress?: (e: any) => void;
  loading: boolean;
  platform?: 'ios' | 'android';
};

export const Composer = ({
  inputText,
  onChangeText,
  onSend,
  onKeyPress,
  loading,
  platform = Platform.OS as 'ios' | 'android',
}: ComposerProps) => {
  const paperTheme = usePaperTheme();
  const { keyboardAppearance, colorTheme, darkMode } = useTheme();
  const COLORS = getThemeColors(paperTheme);
  const isIOS = platform === 'ios';
  
  // Speech recognition integration - COMMENTED OUT DUE TO MISSING HOOK
  /*
  const { 
    transcript, 
    isRecording, 
    startRecording, 
    stopRecording, 
    isSpeechAvailable 
  } = useSpeechRecognition();
  */
  const transcript = ''; // Dummy values
  const isRecording = false;
  const startRecording = () => {};
  const stopRecording = () => {};
  const isSpeechAvailable = false;
  
  // Update input text with speech recognition results
  useEffect(() => {
    if (transcript) {
      // onChangeText(transcript); // Commented out usage
    }
  // }, [transcript]); // Commented out dependency
  }, []); // Use empty dependency array now

  return (
    <View style={styles.inputContainer}>
      {isIOS ? (
        <>
          <TextInput 
            style={[styles.input, { color: paperTheme.colors.onSurface }]}
            placeholder="Message"
            placeholderTextColor={paperTheme.colors.onSurfaceVariant + '99'}
            value={inputText}
            onChangeText={onChangeText}
            onSubmitEditing={onSend}
            multiline
            keyboardAppearance={keyboardAppearance}
            selectionColor={paperTheme.colors.primary}
          />
          
          {!inputText.trim() ? (
            <TouchableOpacity 
              style={[
                styles.mediaButton, 
                // isRecording && { backgroundColor: COLORS.sendButton, borderRadius: 18 } // Commented out usage
              ]} 
              // onPress={isRecording ? stopRecording : startRecording} // Commented out usage
              // disabled={!isSpeechAvailable} // Commented out usage
            >
              {/* {isRecording ? ( // Commented out usage
                <ActivityIndicator size="small" color="white" />
              ) : ( */}
                <MaterialIcons 
                  name="mic" 
                  size={24} 
                  // color={isSpeechAvailable ? (isRecording ? "white" : "#999") : "#CCC"} // Commented out usage
                  color={"#CCC"} // Disabled color
                />
              {/* )} */}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.sendButton, { backgroundColor: COLORS.sendButton }]}
              onPress={onSend}
              disabled={loading}
            >
              <MaterialIcons name="send" size={20} color="white" />
            </TouchableOpacity>
          )}
        </>
      ) : (
        <>
          <Surface style={[styles.inputSurface, { backgroundColor: paperTheme.colors.surface }]} elevation={1}>
            <TextInput
              style={[styles.input, { backgroundColor: COLORS.inputBackground, color: paperTheme.colors.onSurface }]}
              placeholder="Message"
              placeholderTextColor={paperTheme.colors.onSurfaceVariant + '99'}
              value={inputText}
              onChangeText={onChangeText}
              multiline
              editable={!loading}
              onKeyPress={onKeyPress}
              onSubmitEditing={onSend}
              blurOnSubmit={false}
              keyboardAppearance={keyboardAppearance}
              selectionColor={paperTheme.colors.primary}
            />
          </Surface>
          
          {!inputText.trim() ? (
            <IconButton
              // icon={isRecording ? "stop" : "microphone"} // Commented out usage
              icon={"microphone"} // Default icon
              mode="contained"
              // containerColor={isRecording ? COLORS.sendButton : paperTheme.colors.surfaceVariant} // Commented out usage
              containerColor={paperTheme.colors.surfaceVariant} // Default color
              // iconColor={isRecording ? "#FFFFFF" : paperTheme.colors.onSurfaceVariant} // Commented out usage
              iconColor={paperTheme.colors.onSurfaceVariant} // Default color
              size={22}
              // onPress={isRecording ? stopRecording : startRecording} // Commented out usage
              // disabled={!isSpeechAvailable} // Commented out usage
              disabled={true} // Disabled
              style={styles.sendButton}
              // loading={isRecording} // Commented out usage
            />
          ) : (
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
          )}
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
    backgroundColor: 'transparent', // Will use parent background color
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