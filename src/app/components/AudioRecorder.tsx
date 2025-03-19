'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaMicrophone, FaStop, FaSpinner, FaVolumeUp } from 'react-icons/fa';

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
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Request microphone access and set up recorder
  const startRecording = async () => {
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
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      // Stream tracks need to be stopped
      const stream = mediaRecorderRef.current.stream;
      stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      setIsProcessing(true);
    }
  };
  
  // Handle the recording stop event
  const handleRecordingStop = async () => {
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      setAudioUrl(URL.createObjectURL(audioBlob));
      
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
      onTranscription(transcript);
      
      // Send transcript to RAG API
      const ragResponse = await fetch('/api/rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(conversationId ? { 'x-conversation-id': conversationId } : {}),
        },
        body: JSON.stringify({ userQuery: transcript }),
      });
      
      if (!ragResponse.ok) {
        throw new Error(`RAG processing failed: ${ragResponse.status}`);
      }
      
      const { answer } = await ragResponse.json();
      
      // Generate speech from the answer
      const ttsResponse = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: answer }),
      });
      
      if (!ttsResponse.ok) {
        throw new Error(`TTS failed: ${ttsResponse.status}`);
      }
      
      const { audioContent } = await ttsResponse.json();
      
      // Provide the answer and audio to the parent component
      onAIResponse(answer, audioContent);
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
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [isRecording, audioUrl]);
  
  return (
    <div className="flex flex-col items-center p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
      <div className="mb-4">
        {isRecording ? (
          <button
            onClick={stopRecording}
            className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
            disabled={isProcessing}
          >
            <FaStop className="text-xl" />
          </button>
        ) : (
          <button
            onClick={startRecording}
            className="p-4 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <FaSpinner className="text-xl animate-spin" />
            ) : (
              <FaMicrophone className="text-xl" />
            )}
          </button>
        )}
      </div>
      
      {audioUrl && !isRecording && !isProcessing && (
        <div className="mt-2">
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}
      
      {error && (
        <div className="mt-2 text-red-500 text-sm">{error}</div>
      )}
      
      <div className="mt-2 text-sm">
        {isRecording
          ? 'Recording... Click the button to stop'
          : isProcessing
          ? 'Processing your audio...'
          : 'Click the button to start recording'}
      </div>
    </div>
  );
};

export default AudioRecorder; 