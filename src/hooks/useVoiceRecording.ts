import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { createApiService, useAuthenticatedApi } from '../services/api';

/**
 * Custom hook for voice recording and transcription
 * Handles recording audio and sending it to the backend for transcription
 */
export function useVoiceRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingInstance, setRecordingInstance] = useState<Audio.Recording | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'transcribing'>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  const authenticatedApi = useAuthenticatedApi();
  const api = createApiService(authenticatedApi);

  // Request permission when the hook is first used
  useEffect(() => {
    (async () => {
      try {
        console.log('Requesting audio recording permissions...');
        const permission = await Audio.requestPermissionsAsync();
        setPermissionGranted(permission.granted);
        console.log('Audio recording permission:', permission.granted ? 'granted' : 'denied');
        
        // Set audio mode for better recording quality
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          interruptionModeIOS: 1, // DoNotMix
          interruptionModeAndroid: 1, // DoNotMix
        });
      } catch (error) {
        console.error('Error requesting audio permissions:', error);
      }
    })();
  }, []);

  // Increment recording time counter
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  /**
   * Start recording audio
   */
  const start = async () => {
    try {
      if (!permissionGranted) {
        console.warn('Cannot start recording: permission not granted');
        return;
      }
      
      console.log('Starting audio recording...');
      setRecordingStatus('recording');
      
      // Create and prepare a new recording instance
      const recording = new Audio.Recording();
      // Use standard high quality recording options
      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });
      setRecordingInstance(recording);
      
      // Start recording
      await recording.startAsync();
      setIsRecording(true);
      
      console.log('Recording started successfully');
    } catch (error) {
      console.error('Error starting recording:', error);
      setRecordingStatus('idle');
    }
  };

  /**
   * Stop recording and transcribe the audio
   * @returns The transcribed text or empty string if transcription fails
   */
  const stop = async (): Promise<string> => {
    try {
      if (!recordingInstance) {
        console.warn('No active recording to stop');
        return '';
      }
      
      console.log('Stopping audio recording...');
      setRecordingStatus('transcribing');
      
      // Stop the recording
      await recordingInstance.stopAndUnloadAsync();
      setIsRecording(false);
      
      // Get the recording URI
      const uri = recordingInstance.getURI();
      if (!uri) {
        console.error('Recording URI is null');
        setRecordingStatus('idle');
        return '';
      }
      
      console.log(`Recording saved to: ${uri}`);
      console.log('Sending audio for transcription...');
      
      // Send the audio file to the backend for transcription
      try {
        const result = await api.voice.transcribe(uri);
        console.log('Transcription received:', result);
        setRecordingStatus('idle');
        return result;
      } catch (error) {
        console.error('Error transcribing audio:', error);
        setRecordingStatus('idle');
        return '';
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      setRecordingStatus('idle');
      return '';
    }
  };

  /**
   * Cancel the current recording without transcribing
   */
  const cancel = async () => {
    try {
      if (recordingInstance) {
        await recordingInstance.stopAndUnloadAsync();
        setIsRecording(false);
        setRecordingStatus('idle');
        console.log('Recording cancelled');
      }
    } catch (error) {
      console.error('Error cancelling recording:', error);
    }
  };

  return {
    isRecording, 
    recordingStatus,
    recordingTime,
    permissionGranted,
    start,
    stop,
    cancel
  };
}