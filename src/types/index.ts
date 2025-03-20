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
  ragInfo?: {
    operationTime: number;
    matchCount: number;
  };
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
  type: 'audio.transcript';
  transcript: string;
  is_final: boolean;
  message_id?: string;
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

// RAG Analytics Types
export interface RAGQueryResult {
  context: string;
  matches: RAGMatch[];
  operationTime: number;
  requestId: string;
}

export interface RAGMatch {
  id: string;
  score: number;
  text: string;
  source?: string;
}

export interface RAGOperationData {
  id: string;
  query: string;
  conversationId?: string;
  messageId?: string;
  userId?: string;
  timestamp: Date;
  source: string;
  operationTime: number;
  retrievedDocs: RetrievedDocumentData[];
}

export interface RetrievedDocumentData {
  id: string;
  documentId: string;
  similarityScore: number;
  content: string;
  source?: string;
}

export interface RAGAnalytics {
  totalOperations: number;
  avgResponseTime: number;
  successRate: number;
  operationsBySource: {
    chat: number;
    realtime_voice: number;
  };
  topDocuments: {
    documentId: string;
    retrievalCount: number;
    content: string;
  }[];
  recentOperations: RAGOperationData[];
} 