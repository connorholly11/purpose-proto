// API service for communicating with the backend

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';

export interface ChatMessage {
  id?: string;
  userId: string;
  message: string;
  systemPromptMode: 'friendly' | 'challenging';
}

export interface ChatResponse {
  response: string;
  llmUsed: string;
  id: string;
  warning?: string;
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

export interface TTSRequest {
  text: string;
}

export interface TTSResponse {
  message: string;
  text: string;
  audioUrl: string | null;
}

export interface RateRequest {
  id: string;
  rating: boolean;
}

// Chat API
export const sendChatMessage = async (data: ChatMessage): Promise<ChatResponse> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending chat message:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. The server might be busy, please try again later.');
      }
    }
    
    throw error;
  }
};

// Logs API
export const fetchLogs = async (): Promise<LogEntry[]> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${API_BASE_URL}/api/logs`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching logs:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out while fetching logs. Please try again later.');
      }
    }
    
    throw error;
  }
};

// Rate API
export const rateConversation = async (data: RateRequest): Promise<{ message: string }> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${API_BASE_URL}/api/rate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error rating conversation:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out while rating the conversation. Please try again later.');
      }
    }
    
    throw error;
  }
};

// TTS API
export const textToSpeech = async (data: TTSRequest): Promise<TTSResponse> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(`${API_BASE_URL}/api/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error converting text to speech:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out while converting text to speech. Please try again later.');
      }
    }
    
    throw error;
  }
};

// STT API
export const speechToText = async (audioBlob: Blob): Promise<{ transcription: string | null; message: string }> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
    
    const formData = new FormData();
    formData.append('audio', audioBlob);

    const response = await fetch(`${API_BASE_URL}/api/stt`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error converting speech to text:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out while converting speech to text. Please try again later.');
      }
    }
    
    throw error;
  }
};
