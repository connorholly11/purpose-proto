'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaMicrophone, FaStop } from 'react-icons/fa';

interface AudioRecorderProps {
  onTranscription: (text: string) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
  disabled?: boolean;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onTranscription,
  onRecordingStateChange,
  disabled = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
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
  
  // Notify parent component of recording state changes
  useEffect(() => {
    onRecordingStateChange?.(isRecording);
  }, [isRecording, onRecordingStateChange]);
  
  // Start recording
  const startRecording = async () => {
    if (disabled) return;
    
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
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please ensure you have granted permission.');
    }
  };
  
  // Toggle recording
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      
      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      // Reset state
      setIsRecording(false);
    }
  };
  
  // Process the recording
  const processRecording = async () => {
    try {
      setIsProcessing(true);
      
      // Create audio blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Create form data
      const formData = new FormData();
      formData.append('file', audioBlob);
      
      // Send to server for transcription
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.text) {
        // Pass transcription up to parent component
        onTranscription(data.text);
      }
    } catch (err) {
      console.error('Error processing recording:', err);
      setError('Failed to process recording. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Format time as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  return (
    <div className="relative">
      <button
        onClick={toggleRecording}
        disabled={isProcessing || disabled}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
        className={`flex items-center justify-center rounded-full p-2 transition-all 
          ${isRecording 
            ? 'bg-red-500 text-white animate-pulse' 
            : disabled 
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400' 
              : 'bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-600'
          }
        `}
      >
        {isRecording ? (
          <FaStop size={14} />
        ) : (
          <FaMicrophone size={14} />
        )}
      </button>
      
      {isRecording && (
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-800 shadow-md rounded-lg px-3 py-1 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span>{formatDuration(recordingDuration)}</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-xs px-2 py-1 rounded-lg whitespace-nowrap">
          {error}
        </div>
      )}
      
      {isProcessing && (
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-lg whitespace-nowrap">
          Processing...
        </div>
      )}
    </div>
  );
};

export default AudioRecorder; 