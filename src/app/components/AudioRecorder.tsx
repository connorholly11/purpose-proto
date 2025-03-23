'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaMicrophone, FaSpinner, FaPaperPlane } from 'react-icons/fa';

interface AudioRecorderProps {
  onTranscription: (text: string) => void;
  onAIResponse: (text: string, audio: string) => void;
  conversationId?: string;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onTranscription,
  onAIResponse,
  conversationId
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showSendButton, setShowSendButton] = useState(false);
  
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
      setRecordingDuration(0);
    }
    
    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [isRecording]);
  
  // Toggle recording state
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        // Stream tracks need to be stopped
        const stream = mediaRecorderRef.current.stream;
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        setIsProcessing(true);
        setShowSendButton(false);
      }
    } else {
      // Start recording
      try {
        setError(null);
        
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
        mediaRecorder.onstop = handleRecordingStop;
        
        // Start recording
        mediaRecorder.start();
        setIsRecording(true);
        
        // After 3 seconds, show the send button
        setTimeout(() => {
          if (isRecording) {
            setShowSendButton(true);
          }
        }, 3000);
      } catch (err) {
        console.error('Error accessing microphone:', err);
        setError('Could not access microphone. Please ensure you have granted permission.');
      }
    }
  };

  // Handle the recording stop event
  const handleRecordingStop = async () => {
    if (audioChunksRef.current.length === 0) {
      setIsProcessing(false);
      return;
    }
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      
      // Create FormData and append file
      const formData = new FormData();
      formData.append('audioFile', audioBlob, 'recording.wav');
      
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
          className="w-0.5 bg-[var(--imessage-blue)] rounded-full animate-pulse"
          style={{ 
            height: `${6 + Math.random() * 8}px`,
            animationDelay: `${i * 150}ms`, 
            animationDuration: '1s' 
          }}
        ></div>
      ))}
    </div>
  );

  return (
    <>
      {isRecording && (
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-3 py-1 rounded-full text-xs">
          {formatDuration(recordingDuration)}
        </div>
      )}
      
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={toggleRecording}
          disabled={isProcessing}
          className={`
            flex items-center justify-center rounded-full w-8 h-8
            ${isRecording 
              ? 'bg-[var(--imessage-blue)] text-white pulsate-scale'
              : 'text-[var(--imessage-blue)] hover:bg-blue-50 dark:hover:bg-gray-700'
            }
            transition-all duration-200 ease-in-out
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isProcessing ? (
            <FaSpinner className="animate-spin text-[var(--imessage-typing-gray)]" size={16} />
          ) : isRecording ? (
            <SoundWave />
          ) : (
            <FaMicrophone size={16} />
          )}
        </button>
        
        {isRecording && showSendButton && (
          <button
            type="button"
            onClick={toggleRecording}
            className="flex items-center justify-center rounded-full w-8 h-8 bg-[var(--imessage-blue)] text-white"
            aria-label="Send voice message"
          >
            <FaPaperPlane size={14} />
          </button>
        )}
      </div>
    </>
  );
};

export default AudioRecorder; 