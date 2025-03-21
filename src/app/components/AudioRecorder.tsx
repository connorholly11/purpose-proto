'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaMicrophone, FaSpinner } from 'react-icons/fa';

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
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
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
        
        mediaRecorder.onstop = handleRecordingStop;
        
        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Error starting recording:', err);
        setError('Could not access microphone');
      }
    }
  };
  
  // Handle the recording stop event
  const handleRecordingStop = async () => {
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Create FormData to send to API
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      
      // Send to transcription API
      const transcriptionResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!transcriptionResponse.ok) {
        throw new Error(`Transcription failed: ${transcriptionResponse.status}`);
      }
      
      const { transcript } = await transcriptionResponse.json();
      
      // Only perform transcription and pass the result to parent component
      onTranscription(transcript);
      
    } catch (err: any) {
      console.error('Error processing recording:', err);
      setError(err.message || 'Error processing recording');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Cleanup function
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        const stream = mediaRecorderRef.current.stream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isRecording]);
  
  // Sound wave animation for recording indicator
  const SoundWave = () => (
    <div className="flex items-center gap-1 h-4">
      {[1, 2, 3, 4].map((i) => (
        <div 
          key={i}
          className="w-1 bg-red-500 rounded-full animate-pulse"
          style={{ 
            height: `${Math.random() * 16 + 4}px`,
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  );
  
  return (
    <div className="relative">
      {isRecording && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap flex flex-col items-center">
          <span className="text-xs font-medium text-red-500">Listening</span>
          <SoundWave />
        </div>
      )}
      <button
        type="button"
        onClick={toggleRecording}
        disabled={isProcessing}
        className={`py-2 px-4 border transition-colors ${
          isRecording 
            ? 'bg-red-500 hover:bg-red-600 text-white border-red-500' 
            : 'bg-indigo-500 hover:bg-indigo-600 text-white border-indigo-500'
        }`}
        title={isRecording ? "Stop recording" : "Start recording"}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        {isProcessing ? (
          <FaSpinner className="text-lg animate-spin" />
        ) : (
          <FaMicrophone className="text-lg" />
        )}
      </button>
      
      {error && (
        <div className="absolute -bottom-8 left-0 text-red-500 text-xs whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
};

export default AudioRecorder; 