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
}

export interface ChatResponse {
  id: string;
  response: string;
  llmUsed: string;
}

export interface LogEntry {
  id: string;
  userId: string;
  userMessage: string;
  aiResponse: string;
  llmUsed: string;
  rating: boolean | null;
  timestamp: string;
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

// Chat API
export const sendChatMessage = async (chatRequest: ChatRequest): Promise<ChatResponse> => {
  const response = await api.post('/api/chat', chatRequest);
  return response.data;
};

// Logs API
export const getLogs = async (): Promise<LogEntry[]> => {
  const response = await api.get('/api/logs');
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

export default api; 