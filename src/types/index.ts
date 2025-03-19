// Domain Models
export interface User {
  id: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'function_call';
  content: string;
  createdAt: Date;
}

// API Request/Response Types
export interface TranscriptionRequest {
  audioFile: File;
}

export interface TranscriptionResponse {
  transcript: string;
  error?: string;
}

export interface TTSRequest {
  text: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
}

export interface TTSResponse {
  audioContent?: string; // base64 encoded audio
  error?: string;
}

export interface RAGRequest {
  userQuery: string;
}

export interface RAGResponse {
  answer: string;
  error?: string;
}

export interface RealtimeSessionResponse {
  client_secret: {
    value: string;
    expires_at: number;
  };
  session_id: string;
  error?: string;
}

// WebRTC Related Types
export interface RTCDataChannelEvent {
  type: string;
  data?: any;
}

export interface AudioTranscriptEvent {
  audio_transcript: {
    delta: string;
    text: string;
  };
}

export interface TextResponseEvent {
  response: {
    text: {
      delta: string;
      content: string;
    };
  };
}

export interface VoiceActivityEvent {
  voice_activity: {
    is_active: boolean;
  };
}

// Pinecone Types
export interface PineconeDocument {
  id: string;
  values: number[];
  metadata: {
    text: string;
    source?: string;
  };
} 