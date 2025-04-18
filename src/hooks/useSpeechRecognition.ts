import React, { useState, useEffect } from 'react';
import Voice from 'react-native-voice';
import { Platform } from 'react-native';

export const useSpeechRecognition = () => {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  
  // Check if we're on web, where Voice won't work
  const isUnsupportedPlatform = Platform.OS === 'web';
  
  useEffect(() => {
    if (isUnsupportedPlatform) return;
    
    // Set up event listeners for voice recognition
    Voice.onSpeechResults = (e) => {
      if (e.value && e.value.length > 0) {
        setTranscript(e.value[0]);
      }
    };
    
    Voice.onSpeechError = (e) => {
      console.error('Speech recognition error:', e);
    };
    
    // Cleanup function
    return () => {
      if (!isUnsupportedPlatform) {
        Voice.destroy().then(Voice.removeAllListeners);
      }
    };
  }, [isUnsupportedPlatform]);
  
  const startRecording = async () => {
    if (isUnsupportedPlatform) return;
    
    try {
      await Voice.start('en-US');
      setIsRecording(true);
      setTranscript('');
    } catch (e) {
      console.error('Failed to start recording', e);
    }
  };
  
  const stopRecording = async () => {
    if (isUnsupportedPlatform) return;
    
    try {
      await Voice.stop();
      setIsRecording(false);
    } catch (e) {
      console.error('Failed to stop recording', e);
    }
  };
  
  return {
    transcript,
    isRecording,
    startRecording,
    stopRecording,
    isUnsupportedPlatform
  };
};

export default useSpeechRecognition;