import { useState } from 'react';

// Web stub for speech recognition
export const useSpeechRecognition = () => {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  
  // On web, we always indicate the platform is unsupported
  const isUnsupportedPlatform = true;
  const isSpeechAvailable = false;
  
  const startRecording = async () => {
    console.log('Speech recognition not available on web');
    return;
  };
  
  const stopRecording = async () => {
    return;
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