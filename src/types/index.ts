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
  role: 'user' | 'assistant' | 'system' | 'function_call';
  content: string;
  timestamp?: string;
  createdAt?: Date;
  isLoading?: boolean;
  feedback?: 'like' | 'dislike' | null;
  showAvatar?: boolean;
}

// API Request/Response Types
export interface TranscriptionRequest {
  audioFile: File;
}

export interface TranscriptionResponse {
  text: string;
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
  };
  topDocuments: {
    documentId: string;
    retrievalCount: number;
    content: string;
  }[];
  recentOperations: RAGOperationData[];
} 