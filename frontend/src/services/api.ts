import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3003';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ChatRequest {
  userId?: string;
  message: string;
  systemPromptMode?: 'friendly' | 'challenging';
  conversationId?: string;
}

export interface ChatResponse {
  id: string;
  response: string;
  llmUsed: string;
  conversationId: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
  messages: Message[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  llmUsed?: string;
  audioUrl?: string;
  createdAt: string;
  conversationId: string;
}

export interface LogEntry {
  id: string;
  userId?: string;
  type: string;
  data: Record<string, any>;
  rating: boolean | null;
  createdAt: string;
}

export interface RateRequest {
  id: string;
  rating: boolean;
}

export interface RateResponse {
  success: boolean;
}

export interface TTSRequest {
  text: string;
}

export interface TTSResponse {
  audioUrl: string | null;
  message?: string;
}

export interface KnowledgeRequest {
  text: string;
  metadata?: Record<string, any>;
}

export interface KnowledgeResponse {
  success: boolean;
  id: string;
}

// User interface
export interface User {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
  conversationCount?: number;
}

// Log interface
export interface Log {
  id: string;
  userId: string | null;
  type: string;
  data: any;
  createdAt: string;
}

// Stats interface
export interface Stats {
  userCount: number;
  conversationCount: number;
  messageCount: number;
  averageResponseTime: number;
  tokenUsage: {
    total: number;
    completion: number;
    embedding: number;
  };
}

// Realtime API interfaces
export interface RealtimeConnectionOptions {
  systemPromptMode?: 'friendly' | 'challenging';
  userId?: string;
  onOpen?: (event: Event) => void;
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onTranscription?: (text: string) => void;
  onResponse?: (response: string) => void;
}

export interface RealtimeConnection {
  sessionId: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  sendText: (message: string) => void;
  setSystemPromptMode: (mode: 'friendly' | 'challenging') => void;
}

export interface RealtimeSession {
  sessionId: string;
  id: string;
  model: string;
  voice: string;
  client_secret: {
    value: string;
    expires_at: string;
  };
}

// Chat API
export const sendChatMessage = async (chatRequest: ChatRequest): Promise<ChatResponse> => {
  const response = await api.post('/api/chat', chatRequest);
  return response.data;
};

// Conversation API
export const getConversations = async (userId: string): Promise<Conversation[]> => {
  const response = await api.get(`/api/conversations?userId=${userId}`);
  return response.data;
};

export const getConversationMessages = async (conversationId: string): Promise<Message[]> => {
  const response = await api.get(`/api/conversations/${conversationId}/messages`);
  return response.data;
};

// Logs API
export const getLogsForUser = async (type?: string): Promise<LogEntry[]> => {
  const url = type ? `/api/logs?type=${type}` : '/api/logs';
  const response = await api.get(url);
  return response.data;
};

// Rate API
export const rateResponse = async (rateRequest: RateRequest): Promise<RateResponse> => {
  const response = await api.post('/api/rate', rateRequest);
  return response.data;
};

// TTS API
export const textToSpeech = async (ttsRequest: TTSRequest): Promise<TTSResponse> => {
  const response = await api.post('/api/tts', ttsRequest);
  return response.data;
};

// STT API
export const speechToText = async (audioFile: File): Promise<string> => {
  const formData = new FormData();
  formData.append('audio', audioFile);
  
  const response = await axios.post(`${API_URL}/api/stt`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data.transcript;
};

// Realtime API for voice interactions with WebRTC
export const createRealtimeConnection = (options: RealtimeConnectionOptions = {}): RealtimeConnection => {
  let peerConnection: RTCPeerConnection | null = null;
  let dataChannel: RTCDataChannel | null = null;
  let sessionId: string | null = null;
  let ephemeralKey: string | null = null;
  let mediaStream: MediaStream | null = null;
  let audioElement: HTMLAudioElement | null = null;
  let isConnected = false;
  let model = 'gpt-4o-realtime-preview-2024-12-17';
  
  // Create audio element for playing assistant audio
  const setupAudio = () => {
    audioElement = document.createElement("audio");
    audioElement.autoplay = true;
  };
  
  // Parse and handle incoming event data
  const handleDataChannelMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      console.log('Received Realtime API event:', data);
      
      // Handle different event types
      if (data.type === 'transcript.partial' || data.type === 'transcript.complete') {
        if (options.onTranscription && data.transcript?.text) {
          options.onTranscription(data.transcript.text);
        }
      } else if (data.type === 'response.complete' || data.type === 'response.partial') {
        if (options.onResponse && data.response?.text) {
          options.onResponse(data.response.text);
        }
      }
      
      // Pass all messages to the onMessage callback if provided
      if (options.onMessage) {
        options.onMessage(data);
      }
    } catch (error) {
      console.error('Error parsing data channel message:', error);
    }
  };
  
  // Initialize WebRTC connection
  const initializeWebRTC = async (ephemeralToken: string): Promise<void> => {
    try {
      // Create peer connection
      peerConnection = new RTCPeerConnection();
      
      // Setup remote audio from the model
      setupAudio();
      if (peerConnection && audioElement) {
        peerConnection.ontrack = (e) => {
          if (audioElement) {
            audioElement.srcObject = e.streams[0];
          }
        };
      }
      
      // Set up data channel for events
      dataChannel = peerConnection.createDataChannel("oai-events");
      dataChannel.addEventListener("message", handleDataChannelMessage);
      
      // Create WebRTC offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      // Connect to OpenAI Realtime API
      const baseUrl = "https://api.openai.com/v1/realtime";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralToken}`,
          "Content-Type": "application/sdp"
        },
      });
      
      if (!sdpResponse.ok) {
        throw new Error(`Failed to connect to Realtime API: ${sdpResponse.statusText}`);
      }
      
      const answer: RTCSessionDescriptionInit = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      
      await peerConnection.setRemoteDescription(answer);
      isConnected = true;
      
      if (options.onOpen) {
        options.onOpen(new Event('open'));
      }
      
      console.log('WebRTC connection established to OpenAI Realtime API');
      
      // Send initial configuration if needed
      if (options.systemPromptMode) {
        setSystemPromptMode(options.systemPromptMode);
      }
    } catch (error) {
      console.error('Error initializing WebRTC connection:', error);
      if (options.onError) {
        options.onError(new Event('error'));
      }
    }
  };
  
  // Get user media for microphone access
  const getUserMedia = async (): Promise<MediaStream> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });
      return stream;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  };
  
  // Get ephemeral token from backend
  const getEphemeralToken = async (): Promise<RealtimeSession> => {
    try {
      const response = await api.post('/api/realtime/sessions', {
        userId: options.userId,
        systemPromptMode: options.systemPromptMode
      });
      
      sessionId = response.data.sessionId;
      ephemeralKey = response.data.client_secret.value;
      model = response.data.model || model;
      
      return response.data;
    } catch (error) {
      console.error('Error getting ephemeral token:', error);
      throw error;
    }
  };
  
  // Send RAG context to backend
  const processRag = async (message: string): Promise<void> => {
    if (!sessionId) return;
    
    try {
      const response = await api.post(`/api/realtime/sessions/${sessionId}/rag`, {
        message
      });
      
      // Send system prompt with context to model
      if (dataChannel && dataChannel.readyState === 'open') {
        const configEvent = {
          type: 'config.update',
          config: {
            system_prompt: response.data.systemPrompt
          }
        };
        dataChannel.send(JSON.stringify(configEvent));
      }
    } catch (error) {
      console.error('Error processing RAG:', error);
    }
  };
  
  const startRecording = async (): Promise<void> => {
    if (!peerConnection || !isConnected) {
      console.error('WebRTC not connected. Cannot start recording.');
      return;
    }
    
    try {
      // Get microphone access if we don't have it yet
      if (!mediaStream) {
        mediaStream = await getUserMedia();
        
        // Add audio track to peer connection
        if (mediaStream && peerConnection) {
          const audioTrack = mediaStream.getAudioTracks()[0];
          if (audioTrack) {
            peerConnection.addTrack(audioTrack, mediaStream);
          }
        }
      }
      
      // Start the recording by sending the appropriate event
      if (dataChannel && dataChannel.readyState === 'open') {
        const startRecordingEvent = {
          type: 'recorder.start'
        };
        dataChannel.send(JSON.stringify(startRecordingEvent));
      }
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };
  
  const stopRecording = (): void => {
    if (dataChannel && dataChannel.readyState === 'open') {
      const stopRecordingEvent = {
        type: 'recorder.stop'
      };
      dataChannel.send(JSON.stringify(stopRecordingEvent));
    }
  };
  
  const sendText = (message: string): void => {
    if (!dataChannel || dataChannel.readyState !== 'open') {
      console.error('Data channel not open. Cannot send text.');
      return;
    }
    
    // Process with RAG if available
    processRag(message).catch(console.error);
    
    // Send text input to the model
    const textInputEvent = {
      type: 'text.input',
      input: {
        text: message
      }
    };
    dataChannel.send(JSON.stringify(textInputEvent));
  };
  
  const setSystemPromptMode = (mode: 'friendly' | 'challenging'): void => {
    if (!dataChannel || dataChannel.readyState !== 'open') {
      console.error('Data channel not open. Cannot set system prompt.');
      return;
    }
    
    const systemPrompt = mode === 'challenging' 
      ? 'You are a challenging AI assistant that pushes users to think critically. You question assumptions and encourage deeper analysis.'
      : 'You are a friendly AI assistant, very supportive and encouraging. You aim to help the user feel comfortable and confident.';
    
    const configEvent = {
      type: 'config.update',
      config: {
        system_prompt: systemPrompt
      }
    };
    dataChannel.send(JSON.stringify(configEvent));
  };
  
  const disconnect = (): void => {
    // Stop media stream if active
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      mediaStream = null;
    }
    
    // Close data channel
    if (dataChannel) {
      dataChannel.close();
      dataChannel = null;
    }
    
    // Close peer connection
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }
    
    isConnected = false;
    
    if (options.onClose) {
      options.onClose(new CloseEvent('close'));
    }
    
    console.log('WebRTC connection closed');
  };
  
  return {
    sessionId,
    isConnected,
    
    connect: async () => {
      try {
        // Get ephemeral token
        const session = await getEphemeralToken();
        
        // Initialize WebRTC with the token
        await initializeWebRTC(session.client_secret.value);
      } catch (error) {
        console.error('Error connecting to Realtime API:', error);
        if (options.onError) {
          options.onError(new Event('error'));
        }
      }
    },
    
    disconnect,
    startRecording,
    stopRecording,
    sendText,
    setSystemPromptMode
  };
};

// Check Realtime API status
export const getRealtimeStatus = async (): Promise<{ status: string; activeSessions: number; message: string }> => {
  const response = await api.get('/api/realtime/status');
  return response.data;
};

// Create a Realtime session (get ephemeral token)
export const createRealtimeSession = async (options: {
  userId?: string;
  systemPromptMode?: 'friendly' | 'challenging';
}): Promise<RealtimeSession> => {
  const response = await api.post('/api/realtime/sessions', options);
  return response.data;
};

// Store Realtime session data
export const storeRealtimeSessionData = async (
  sessionId: string,
  data: {
    userMessage?: string;
    assistantMessage?: string;
    systemPrompt?: string;
    usedRag?: boolean;
  }
): Promise<{ success: boolean }> => {
  const response = await api.post(`/api/realtime/sessions/${sessionId}/data`, data);
  return response.data;
};

export default api;