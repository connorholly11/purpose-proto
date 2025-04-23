import { Platform } from 'react-native';

/**
 * Safely loads the Voice module only on iOS
 * @returns Voice module or null if not available
 */
export async function safeLoadVoice() {
  if (Platform.OS !== 'ios') return null;
  
  try {
    const Voice = (await import('react-native-voice')).default;
    return Voice;
  } catch (error) {
    console.warn('[Voice] Module unavailable:', error);
    return null;
  }
}

/**
 * Safely loads Speech Recognition only on iOS
 * @returns Speech recognition module or null if not available
 */
export async function safeLoadSpeechRecognition() {
  if (Platform.OS !== 'ios') return null;
  
  try {
    const SpeechRecognition = await import('expo-speech-recognition');
    return SpeechRecognition;
  } catch (error) {
    console.warn('[SpeechRecognition] Module unavailable:', error);
    return null;
  }
}