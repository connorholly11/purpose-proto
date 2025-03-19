'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FaMicrophone, FaStop, FaSpinner, FaVolumeUp, FaVolumeDown, FaVolumeMute } from 'react-icons/fa';
import 'webrtc-adapter';
import { 
  RTCDataChannelEvent, 
  AudioTranscriptEvent, 
  TextResponseEvent,
  VoiceActivityEvent 
} from '@/types';

interface RealtimeVoiceProps {
  conversationId?: string;
  onPartialTranscript?: (text: string) => void;
  onCompletedTranscript?: (text: string) => void;
  onPartialResponse?: (text: string) => void;
  onCompletedResponse?: (text: string) => void;
}

const RealtimeVoice: React.FC<RealtimeVoiceProps> = ({
  onPartialTranscript,
  onCompletedTranscript,
  onPartialResponse,
  onCompletedResponse,
  conversationId
}) => {
  const [status, setStatus] = useState<string>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  // WebRTC refs
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  
  // Initialize the connection to the Realtime API
  const initRealtime = useCallback(async () => {
    try {
      setStatus('Requesting ephemeral token...');
      setError(null);
      
      // Get ephemeral token from our backend
      const tokenResponse = await fetch('/api/rt-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voice: 'alloy' // or pass as prop for customization
        }),
      });
      
      if (!tokenResponse.ok) {
        throw new Error(`Error getting session token: ${tokenResponse.status}`);
      }
      
      const { client_secret, session_id } = await tokenResponse.json();
      sessionIdRef.current = session_id;
      
      setStatus('Setting up WebRTC connection...');
      
      // Create and configure RTCPeerConnection
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;
      
      // Set up audio element for output
      if (!audioElementRef.current) {
        const audioEl = new Audio();
        audioEl.autoplay = true;
        audioEl.volume = volume;
        audioElementRef.current = audioEl;
      }
      
      // Handle incoming audio stream
      pc.ontrack = (event) => {
        if (audioElementRef.current) {
          audioElementRef.current.srcObject = event.streams[0];
        }
      };
      
      // Set up data channel for events
      const dc = pc.createDataChannel('oai-events');
      dataChannelRef.current = dc;
      
      // Handle data channel events
      dc.onopen = () => {
        setIsConnected(true);
        setStatus('Connected');
      };
      
      dc.onclose = () => {
        setIsConnected(false);
        setStatus('Disconnected');
      };
      
      dc.onmessage = (event) => {
        handleDataChannelMessage(event);
      };
      
      // Get local audio stream and add to peer connection
      setStatus('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      
      // Create offer
      setStatus('Creating connection offer...');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      // Ensure the local description is set before continuing
      if (!pc.localDescription) {
        throw new Error('Failed to set local description');
      }
      
      // Send the SDP to the Realtime API
      setStatus('Connecting to OpenAI Realtime...');
      const sdpResponse = await fetch(`https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${client_secret.value}`,
          'Content-Type': 'application/sdp',
        },
        body: pc.localDescription.sdp,
      });
      
      if (!sdpResponse.ok) {
        throw new Error(`Error connecting to Realtime API: ${sdpResponse.status}`);
      }
      
      // Get the SDP answer and set as remote description
      const answerSDP = await sdpResponse.text();
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSDP,
      });
      
      setStatus('Connected to Realtime');
    } catch (err: any) {
      console.error('Error setting up Realtime connection:', err);
      setError(err.message || 'Failed to connect to Realtime API');
      setStatus('Connection failed');
      
      // Clean up if connection fails
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    }
  }, [volume]);
  
  // Handle incoming data channel messages
  const handleDataChannelMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      // Handle partial transcripts
      if (data && 'audio_transcript' in data) {
        const transcriptEvent = data as AudioTranscriptEvent;
        const transcript = transcriptEvent.audio_transcript.text;
        setTranscript(transcript);
        onPartialTranscript?.(transcript);
        
        // If we have a conversation ID and enough transcript text, send to RAG
        // Also log completed utterances from the user
        if (conversationId && transcript.trim().length > 20) {
          // Check if transcript appears to be complete (not ending with ...)
          const isCompleteUtterance = !transcript.endsWith('...') && 
            !transcript.endsWith('.') && 
            !transcript.endsWith('?') && 
            data.audio_transcript.is_final;
          
          if (isCompleteUtterance) {
            console.log("Completed transcript:", transcript);
            onCompletedTranscript?.(transcript);
          }
          
          // Send to RAG API for memory/embeddings regardless - don't await the result
          fetch('/api/rag', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-conversation-id': conversationId,
              'x-source': 'realtime_voice', // Mark as coming from real-time voice
            },
            body: JSON.stringify({ userQuery: transcript }),
          }).catch(err => {
            console.error('Error sending transcript to RAG:', err);
          });
        }
      }
      
      // Handle text responses
      if (data && 'response' in data && typeof data.response === 'object' && data.response && 'text' in data.response) {
        const responseEvent = data as TextResponseEvent;
        const responseText = responseEvent.response.text.content;
        setResponse(responseText);
        onPartialResponse?.(responseText);
        
        // Check for completed response
        if (data.response.text.is_final) {
          onCompletedResponse?.(responseText);
        }
      }
      
      // Handle voice activity events
      if (data && 'voice_activity' in data) {
        const voiceEvent = data as VoiceActivityEvent;
        setIsSpeaking(voiceEvent.voice_activity.is_active);
      }
      
      // Handle other events as needed
      // console.log('Data channel event:', data);
    } catch (err) {
      console.error('Error processing data channel message:', err);
    }
  };
  
  // Disconnect and clean up
  const disconnect = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    
    if (audioElementRef.current) {
      audioElementRef.current.srcObject = null;
    }
    
    setIsConnected(false);
    setStatus('Disconnected');
    setTranscript('');
    setResponse('');
  }, []);
  
  // Update audio volume
  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);
  
  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  // Change volume
  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };
  
  return (
    <div className="flex flex-col space-y-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="flex flex-col items-center">
        {!isConnected ? (
          <button
            onClick={initRealtime}
            className="p-4 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors"
            disabled={status !== 'idle' && status !== 'Disconnected' && status !== 'Connection failed'}
          >
            {status === 'idle' || status === 'Disconnected' || status === 'Connection failed' ? (
              <FaMicrophone className="text-xl" />
            ) : (
              <FaSpinner className="text-xl animate-spin" />
            )}
          </button>
        ) : (
          <button
            onClick={disconnect}
            className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
          >
            <FaStop className="text-xl" />
          </button>
        )}
      </div>
      
      <div className="text-center text-sm">
        {status}
      </div>
      
      {error && (
        <div className="text-red-500 text-sm text-center">
          {error}
        </div>
      )}
      
      {isConnected && (
        <>
          <div className="p-2 bg-white dark:bg-gray-700 rounded shadow">
            <div className="text-xs text-gray-500 dark:text-gray-300 mb-1">You said:</div>
            <div className="italic text-sm">
              {transcript || 'Waiting for speech...'}
            </div>
          </div>
          
          <div className="p-2 bg-blue-50 dark:bg-gray-600 rounded shadow">
            <div className="text-xs text-gray-500 dark:text-gray-300 mb-1">Response:</div>
            <div className="text-sm">
              {response || 'Waiting for response...'}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button onClick={toggleMute} className="p-2">
              {isMuted ? (
                <FaVolumeMute className="text-red-500" />
              ) : volume < 0.3 ? (
                <FaVolumeDown />
              ) : (
                <FaVolumeUp />
              )}
            </button>
            
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={changeVolume}
              className="w-full"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default RealtimeVoice; 