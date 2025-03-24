'use client';

import React, { useState, useRef, useEffect } from 'react';

interface AudioRecorderProps {
  onTranscription: (text: string) => void;
  onAIResponse: (text: string, audio: string) => void;
  conversationId?: string;
  className?: string;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onTranscription,
  onAIResponse,
  conversationId,
  className = ''
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showSendButton, setShowSendButton] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Timer for recording duration
  useEffect(() => {
    if (isRecording) {
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    }
    
    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [isRecording]);
  
  // Prevent accidental recording activation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !isRecording) {
        e.stopPropagation();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown, true);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isRecording]);
  
  // Start recording
  const startRecording = async () => {
    try {
      setError(null);
      setRecordingDuration(0);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Define what happens when recording stops
      mediaRecorder.onstop = processRecording;
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      
      // After 2 seconds, show the send button
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          setShowSendButton(true);
        }
      }, 2000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please ensure you have granted permission.');
    }
  };
  
  // Handle microphone button click
  const handleMicrophoneClick = () => {
    setLastClickTime(Date.now());
    startRecording();
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      
      // Stop all audio tracks
      const stream = mediaRecorderRef.current.stream;
      stream.getTracks().forEach(track => track.stop());
      
      setIsRecording(false);
      setIsProcessing(true);
      setShowSendButton(false);
    }
  };

  // Process the recording after stopping
  const processRecording = async () => {
    if (audioChunksRef.current.length === 0) {
      setIsProcessing(false);
      return;
    }
    
    try {
      // Use audio/webm format instead of wav which might not be supported
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Create FormData and append file with the correct field name
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      
      if (conversationId) {
        formData.append('conversationId', conversationId);
      }
      
      // Send to transcription API
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.transcript) {
        onTranscription(data.transcript);
      }
    } catch (err) {
      console.error('Error processing audio:', err);
      setError('Failed to process audio. Please try again.');
    } finally {
      setIsProcessing(false);
      setShowSendButton(false);
    }
  };
  
  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Animated sound wave component for recording state
  const SoundWave = () => (
    <div className="flex items-center space-x-1">
      {[...Array(4)].map((_, i) => (
        <div 
          key={i}
          className="w-0.5 bg-red-500 rounded-full animate-pulse"
          style={{ 
            height: `${6 + Math.random() * 8}px`,
            animationDelay: `${i * 150}ms`, 
            animationDuration: '0.8s' 
          }}
        ></div>
      ))}
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      {isProcessing ? (
        <div className="p-2 rounded-full bg-blue-50/80 dark:bg-slate-800/80 text-[var(--primary-blue)]">
          <span className="animate-spin inline-block">⏳</span>
        </div>
      ) : isRecording ? (
        <button
          onClick={stopRecording}
          className="enhanced-button p-2 rounded-full bg-red-500/90 text-white hover:bg-red-600/90"
          aria-label="Stop recording"
        >
          ⏹️
        </button>
      ) : showSendButton ? (
        <button
          onClick={processRecording}
          disabled={isProcessing}
          className="enhanced-button p-2 rounded-full primary-btn"
          aria-label="Send transcribed message"
        >
          Send
        </button>
      ) : (
        <button
          onClick={handleMicrophoneClick}
          className="enhanced-button p-2 rounded-full text-[var(--primary-blue)] bg-blue-50/80 dark:bg-slate-800/80 hover:bg-blue-100/80 dark:hover:bg-slate-700/80"
          aria-label="Start recording"
          type="button"
        >
          🎤
        </button>
      )}

      {error && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-red-100 text-red-500 text-xs px-2 py-1 rounded shadow-sm">
          {error}
        </div>
      )}
      
      {isRecording && (
        <div className="absolute left-10 -top-6 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-lg shadow-sm">
          <div className="flex items-center space-x-1">
            <span className="animate-pulse">⚫</span>
            <span className="text-xs text-red-600 dark:text-red-400 font-medium">Recording...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder; 