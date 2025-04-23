import React, { useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Platform, StyleSheet, ActivityIndicator } from 'react-native';
import { Surface, IconButton } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme as usePaperTheme } from 'react-native-paper';
import { getThemeColors } from '../styles';
import { createPlatformStyleSheet, spacing, platformSelect } from '../../theme';
import { getShadow as createShadow } from '../../theme/platformUtils';
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
          <View style={styles.iosInputWrapper}>
            <Surface 
              style={[
                styles.iosInputSurface, 
                { backgroundColor: darkMode ? '#1C1C1E' : '#F2F2F7' } // iMessage-like colors with dark mode support
              ]}
            >
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
                  style={styles.mediaButton} 
                  // onPress={isRecording ? stopRecording : startRecording} // Commented out usage
                  // disabled={!isSpeechAvailable} // Commented out usage
                >
                  {/* {isRecording ? ( // Commented out usage
                    <ActivityIndicator size="small" color="white" />
                  ) : ( */}
                    <MaterialIcons 
                      name="mic" 
                      size={22} 
                      // color={isSpeechAvailable ? (isRecording ? "white" : "#999") : "#CCC"} // Commented out usage
                      color={darkMode ? "#777" : "#999"} // Adjusted for dark mode
                    />
                  {/* )} */}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.sendButton, { backgroundColor: COLORS.sendButton }]}
                  onPress={onSend}
                  disabled={loading}
                >
                  <MaterialIcons name="send" size={18} color="white" />
                </TouchableOpacity>
              )}
            </Surface>
          </View>
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
    padding: Platform.OS === 'ios' ? 8 : spacing.md,
    paddingBottom: platformSelect({
      ios: 24, // Increased bottom padding to move input up from bottom of screen
      android: spacing.lg,
      default: spacing.md
    }),
    backgroundColor: 'transparent', // Will use parent background color
    borderTopWidth: Platform.OS === 'ios' ? 0.5 : 0, // Thinner border
    borderTopColor: '#e0e0e0',
  },
  iosInputWrapper: {
    flex: 1,
    paddingHorizontal: 12, // Add horizontal spacing as requested
    paddingVertical: 6,
    paddingBottom: 8, // Additional bottom padding
    flexDirection: 'row',
    alignItems: 'center',
  },
  iosInputSurface: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22, // More rounded for iMessage look
    backgroundColor: '#F2F2F7', // Light gray background like iMessage
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 38,
    maxHeight: 120,
    ...createShadow(1),
  },
  inputSurface: {
    flex: 1,
    borderRadius: 20, 
    marginRight: spacing.sm,
    overflow: 'hidden',
    ...createShadow(1),
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: Platform.OS === 'ios' ? 8 : undefined,
    paddingVertical: Platform.OS === 'ios' ? 8 : undefined,
    marginLeft: Platform.OS === 'ios' ? 4 : 0,
    marginRight: Platform.OS === 'ios' ? 2 : 0,
    fontSize: 16,
    maxHeight: 100, // Don't let text input get too tall
  },
  mediaButton: {
    width: 30,
    height: 30,
    marginRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    borderRadius: 15, // Perfect circle
    width: 30, // iMessage has a smaller send button
    height: 30, // iMessage has a smaller send button
    margin: 2,
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    ...createShadow(1),
  },
});

export default Composer;