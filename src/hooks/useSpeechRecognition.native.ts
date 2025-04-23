import React, { useState, useEffect } from 'react';
import Voice from 'react-native-voice';
import { Platform } from 'react-native';
import * as ExpoSpeechRecognition from 'expo-speech-recognition';

export const useSpeechRecognition = () => {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechAvailable, setIsSpeechAvailable] = useState(false);
  
  // We only support iOS & Android; others are unsupported
  const isUnsupportedPlatform = Platform.OS !== 'ios' && Platform.OS !== 'android';
  const isIOS = Platform.OS === 'ios';
  
  // Check for speech recognition availability
  useEffect(() => {
    const checkAvailability = async () => {
      if (isUnsupportedPlatform) return;
      
      if (isIOS) {
        const available = await ExpoSpeechRecognition.isAvailableAsync();
        setIsSpeechAvailable(available);
      } else {
        // On Android, assume available (Voice API doesn't have a reliable check)
        setIsSpeechAvailable(true);
      }
    };
    
    checkAvailability();
  }, [isUnsupportedPlatform, isIOS]);
  
  // Set up event listeners for Android (Voice API)
  useEffect(() => {
    if (isUnsupportedPlatform || isIOS) return;
    
    // Set up event listeners for voice recognition
    Voice.onSpeechResults = (e) => {
      if (e.value && e.value.length > 0) {
        setTranscript(e.value[0]);
      }
    };
    
    Voice.onSpeechError = (e) => {
      console.error('Speech recognition error:', e);
      setIsRecording(false);
    };
    
    // Cleanup function
    return () => {
      if (!isUnsupportedPlatform && !isIOS) {
        Voice.destroy().then(Voice.removeAllListeners);
      }
    };
  }, [isUnsupportedPlatform, isIOS]);
  
  // For iOS, set up Expo's speech recognition
  useEffect(() => {
    if (!isIOS || isUnsupportedPlatform) return;
    
    // Set up listener for Expo SpeechRecognition results
    const subscription = ExpoSpeechRecognition.addListener((result) => {
      if (result.eventType === 'results') {
        if (result.results && result.results.length > 0 && result.results[0]?.transcript) {
          setTranscript(result.results[0].transcript);
        }
      } else if (result.eventType === 'error') {
        console.error('Expo speech recognition error:', result.error);
        setIsRecording(false);
      }
    });
    
    return () => {
      subscription.remove();
    };
  }, [isIOS, isUnsupportedPlatform]);
  
  const startRecording = async () => {
    if (isUnsupportedPlatform || !isSpeechAvailable) {
      console.log('Speech recognition not available on this platform');
      return;
    }
    
    try {
      setTranscript('');
      
      if (isIOS) {
        await ExpoSpeechRecognition.startAsync({
          locale: 'en-US',
          continuous: true // Keep listening until explicitly stopped
        });
      } else {
        await Voice.start('en-US');
      }
      
      setIsRecording(true);
    } catch (e) {
      console.error('Failed to start recording', e);
      setIsRecording(false);
    }
  };
  
  const stopRecording = async () => {
    if (isUnsupportedPlatform || !isRecording) return;
    
    try {
      if (isIOS) {
        await ExpoSpeechRecognition.stopAsync();
      } else {
        await Voice.stop();
      }
    } catch (e) {
      console.error('Failed to stop recording', e);
    } finally {
      setIsRecording(false);
    }
  };
  
  return {
    transcript,
    isRecording,
    startRecording,
    stopRecording,
    isUnsupportedPlatform,
    isSpeechAvailable
  };
};

export default useSpeechRecognition;