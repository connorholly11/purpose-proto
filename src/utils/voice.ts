import { Platform } from 'react-native';
import { Audio } from 'expo-av';

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

/**
 * Initializes audio recording settings for the app
 * Should be called early in the app lifecycle
 */
export async function initializeVoiceRecording(): Promise<boolean> {
  try {
    // Check for permissions
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      console.warn('Audio recording permission not granted');
      return false;
    }
    
    // Set audio mode for better recording quality
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      interruptionModeIOS: 1, // DoNotMix
      interruptionModeAndroid: 1, // DoNotMix
    });
    
    console.log('Voice recording initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing voice recording:', error);
    return false;
  }
}

/**
 * Gets the estimated file size for a recording of given duration
 * @param durationMs Recording duration in milliseconds
 * @returns Estimated file size in bytes
 */
export function estimateAudioFileSize(durationMs: number): number {
  // High quality audio recording is roughly 128kbps
  const bitsPerSecond = 128 * 1000;
  const bytes = (durationMs / 1000) * (bitsPerSecond / 8);
  return Math.ceil(bytes);
}

/**
 * Formats recording time in MM:SS format
 * @param seconds Recording time in seconds
 * @returns Formatted time string
 */
export function formatRecordingTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}