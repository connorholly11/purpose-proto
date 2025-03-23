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
import browserLogger from '@/lib/utils/browser-logger';

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
  const [messageCount, setMessageCount] = useState<number>(0);
  const [lastTranscriptTime, setLastTranscriptTime] = useState<number>(0);
  
  // WebRTC refs
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  
  // Initialize the connection to the Realtime API
  const initRealtime = useCallback(async () => {
    console.log('🎙️ STARTING REALTIME VOICE SESSION - Initialization beginning');
    try {
      setStatus('Requesting ephemeral token...');
      setError(null);
      
      // Get ephemeral token from our backend
      console.log('🔑 Requesting ephemeral token from /api/rt-session');
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
      console.log('🔄 Setting up WebRTC peer connection and data channel');
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
        console.log('📣 WebRTC data channel opened successfully');
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
      
      if (!pc.localDescription) {
        throw new Error('Failed to set local description');
      }
      
      // Send the SDP to the Realtime API
      setStatus('Connecting to OpenAI Realtime...');
      const sdpResponse = await fetch(
        `https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${client_secret.value}`,
            'Content-Type': 'application/sdp',
          },
          body: pc.localDescription.sdp,
        }
      );
      
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
      console.error('❌ Error setting up Realtime connection:', err);
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
      // Log raw data for debugging
      console.log('📨 RAW DATA CHANNEL MESSAGE:', event.data.substring(0, 100) + (event.data.length > 100 ? '...' : ''));
      
      // Increment message counter
      setMessageCount(prev => prev + 1);
      
      const data = JSON.parse(event.data);
      console.log('🧩 DATA CHANNEL MESSAGE TYPE:', data.type);
      browserLogger.debug('RealtimeVoice', 'Data channel message received', { 
        type: data.type,
        messageId: data.message_id
      });
      
      // Handle transcript updates
      if (data.type === 'audio.transcript') {
        console.log(`🎤 Transcript event received: ${data.is_final ? 'FINAL' : 'partial'}`);
        const transcriptEvent = data as AudioTranscriptEvent;
        setLastTranscriptTime(Date.now());
        
        if (transcriptEvent.transcript) {
          console.log(`📝 RAW TRANSCRIPT: "${transcriptEvent.transcript}" (is_final: ${transcriptEvent.is_final})`);
          const finalTranscript = transcriptEvent.transcript;
          browserLogger.debug('RealtimeVoice', 'Final transcript segment received', {
            isFinal: transcriptEvent.is_final,
            transcriptLength: finalTranscript.length,
            transcriptPreview: finalTranscript.length > 30 ? finalTranscript.substring(0, 30) + '...' : finalTranscript
          });
          
          // Check if this is a complete utterance (has punctuation at the end)
          const isCompleteUtterance = /[.!?]$/.test(finalTranscript.trim());
          
          if (isCompleteUtterance && finalTranscript.trim().length > 0) {
            console.log(`✅ COMPLETE UTTERANCE DETECTED: "${finalTranscript}"`);
            // Process the complete utterance
            browserLogger.info('RealtimeVoice', 'Complete utterance detected');
            setTranscript(prev => {
              const completeUtterance = prev + ' ' + finalTranscript;
              const cleanedUtterance = completeUtterance.trim();
              
              browserLogger.debug('RealtimeVoice', 'Complete utterance details', {
                utteranceLength: cleanedUtterance.length,
                utterancePreview: cleanedUtterance.substring(0, 50) + (cleanedUtterance.length > 50 ? '...' : '')
              });
              
              // Call callback for complete transcript
              if (onCompletedTranscript) {
                console.log(`📢 SENDING FINAL TRANSCRIPT TO RAG PIPELINE: "${cleanedUtterance}"`);
                browserLogger.debug('RealtimeVoice', 'Calling onCompletedTranscript callback');
                console.log(`🔤 Final transcript received: "${cleanedUtterance}"`);
                onCompletedTranscript(cleanedUtterance);
              }
              
              // (Removed direct rag-service call here; parent handles RAG now)
              
              return ''; // Reset for next utterance
            });
          } else {
            console.log(`📝 Accumulating partial transcript: "${finalTranscript}"`);
            // Accumulate partial transcripts
            browserLogger.debug('RealtimeVoice', 'Accumulating partial transcript');
            setTranscript(prev => prev + ' ' + finalTranscript);
            
            // Call callback for partial transcript
            if (onPartialTranscript) {
              const updatedTranscript = transcript + ' ' + finalTranscript;
              browserLogger.debug('RealtimeVoice', 'Calling onPartialTranscript callback', {
                transcriptLength: updatedTranscript.length
              });
              onPartialTranscript(updatedTranscript);
            }
          }
          
          // Make a more permissive utterance checker after a certain amount of content is accumulated
          if (transcript.trim().length > 15 && data.is_final) {
            console.log(`💡 SIGNIFICANT CONTENT DETECTED (${transcript.length} chars) - Processing as utterance`);
            const cleanedUtterance = transcript.trim();
            if (onCompletedTranscript) {
              console.log(`📢 SENDING SIGNIFICANT CONTENT TO RAG: "${cleanedUtterance}"`);
              onCompletedTranscript(cleanedUtterance);
              setTranscript('');
            }
          }
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
      
    } catch (err) {
      console.error('❌ Error processing data channel message:', err);
    }
  };
  
  // Disconnect and clean up
  const disconnect = useCallback(() => {
    console.log('🛑 ENDING REALTIME VOICE SESSION - Cleaning up resources');
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
  
  // Force-send transcript after silence
  useEffect(() => {
    if (!transcript || !isConnected) return;
    
    const checkSilenceTimer = setTimeout(() => {
      const silenceTime = Date.now() - lastTranscriptTime;
      if (silenceTime > 2000 && transcript.trim().length > 0) {
        console.log(`⏱️ SILENCE DETECTED FOR ${silenceTime}ms - Force sending transcript: "${transcript}"`);
        if (onCompletedTranscript) {
          console.log(`📢 FORCE-SENDING TRANSCRIPT TO RAG PIPELINE: "${transcript}"`);
          onCompletedTranscript(transcript);
          setTranscript('');
        }
      }
    }, 2500);
    
    return () => clearTimeout(checkSilenceTimer);
  }, [transcript, lastTranscriptTime, isConnected, onCompletedTranscript]);
  
  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  // Change volume
  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };
  
  // Render the main UI for the realtime voice component
  return (
    <div className="flex flex-col items-center">
      {/* Status display */}
      <div className="w-full mb-4">
        {error && (
          <div className="text-red-500 text-sm mb-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
            {error}
          </div>
        )}
        
        <div className="text-center">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            isConnected 
              ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400' 
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            {status}
          </div>
        </div>
      </div>
      
      {/* Voice visualization */}
      <div className="flex justify-center items-center mb-4 relative">
        <div className={`rounded-full flex items-center justify-center transition-all ${
          isSpeaking 
            ? 'w-20 h-20 bg-[var(--imessage-blue)] pulsate-scale' 
            : 'w-16 h-16 bg-gray-200 dark:bg-gray-700'
        }`}>
          {isSpeaking ? (
            <div className="flex items-center space-x-1">
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i}
                  className="w-1 bg-white rounded-full animate-pulse"
                  style={{ 
                    height: `${8 + Math.random() * 16}px`,
                    animationDelay: `${i * 150}ms`
                  }}
                ></div>
              ))}
            </div>
          ) : (
            <FaMicrophone 
              size={24} 
              className={isConnected ? 'text-[var(--imessage-blue)]' : 'text-gray-400'} 
            />
          )}
        </div>
        
        {messageCount > 0 && (
          <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {messageCount}
          </div>
        )}
      </div>
      
      {/* Connection control buttons */}
      <div className="flex justify-center space-x-4 mb-4">
        {!isConnected ? (
          <button
            onClick={initRealtime}
            disabled={status !== 'idle' && status !== 'Disconnected' && status !== 'Connection failed'}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              status === 'idle' || status === 'Disconnected' || status === 'Connection failed'
                ? 'bg-[var(--imessage-blue)] text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {status === 'idle' || status === 'Disconnected' || status === 'Connection failed' ? (
              'Start Voice Chat'
            ) : (
              <span className="flex items-center">
                <FaSpinner className="animate-spin mr-2" size={14} />
                Connecting...
              </span>
            )}
          </button>
        ) : (
          <button
            onClick={disconnect}
            className="px-5 py-2 rounded-full text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            End Voice Chat
          </button>
        )}

        {transcript && isConnected && (
          <button 
            onClick={() => {
              if (transcript.trim() && onCompletedTranscript) {
                console.log(`🔔 MANUALLY SENDING TRANSCRIPT: "${transcript}"`);
                onCompletedTranscript(transcript);
                setTranscript('');
              }
            }}
            className="px-5 py-2 rounded-full text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Send Message
          </button>
        )}
      </div>
      
      {/* Volume controls */}
      <div className="w-full max-w-xs mb-4 px-4">
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setIsMuted(prev => !prev)}
            className="text-[var(--imessage-blue)]"
          >
            {isMuted ? <FaVolumeMute size={16} /> : <FaVolumeUp size={16} />}
          </button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setVolume(val);
              setIsMuted(val === 0);
              if (audioElementRef.current) {
                audioElementRef.current.volume = val;
              }
            }}
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          
          <button 
            onClick={() => {
              const newVolume = Math.min(1, volume + 0.1);
              setVolume(newVolume);
              setIsMuted(false);
              if (audioElementRef.current) {
                audioElementRef.current.volume = newVolume;
              }
            }}
            className="text-[var(--imessage-blue)]"
          >
            <FaVolumeUp size={16} />
          </button>
        </div>
      </div>
      
      {/* Transcript display */}
      {transcript && (
        <div className="w-full p-3 mb-4 bg-[var(--imessage-gray)] text-sm rounded-2xl dark:text-black">
          <p className="font-medium text-xs mb-1 text-gray-500">Your message:</p>
          {transcript}
        </div>
      )}
      
      {/* Response display */}
      {response && (
        <div className="w-full p-3 mb-4 bg-[var(--imessage-blue)] text-white text-sm rounded-2xl">
          <p className="font-medium text-xs mb-1 text-blue-100">Response:</p>
          {response}
        </div>
      )}
      
      {/* Audio element for playback */}
      <audio ref={audioElementRef} className="hidden" />
    </div>
  );
};

export default RealtimeVoice;
