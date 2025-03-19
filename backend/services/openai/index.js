const { OpenAI } = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Service for OpenAI API interactions
 */
const openaiService = {
  /**
   * Generate a chat completion
   * @param {Array} messages - Array of message objects {role, content}
   * @param {string} systemPrompt - System prompt to use
   * @param {object} options - Additional options
   * @returns {Promise<object>} - OpenAI completion response
   */
  async generateChatCompletion(messages, systemPrompt, options = {}) {
    const allMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const completion = await openai.chat.completions.create({
      model: options.model || 'gpt-4o',
      messages: allMessages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens,
      stream: options.stream || false,
    });

    return completion;
  },

  /**
   * Generate embeddings for text
   * @param {string} text - Text to generate embeddings for
   * @returns {Promise<Array>} - Embedding vector
   */
  async generateEmbedding(text) {
    const response = await openai.embeddings.create({
      model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  },

  /**
   * Generate embeddings for multiple texts
   * @param {Array} texts - Array of text strings
   * @returns {Promise<Array>} - Array of embedding vectors
   */
  async generateEmbeddings(texts) {
    const response = await openai.embeddings.create({
      model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
      input: texts,
    });

    return response.data.map(item => item.embedding);
  },

  /**
   * Create a new Realtime API session with an ephemeral token
   * @param {object} options - Session options
   * @param {string} options.model - Realtime model ID
   * @param {string} options.voice - Voice to use
   * @returns {Promise<object>} - Session data with ephemeral token
   */
  async createRealtimeSession(options = {}) {
    try {
      const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options.model || 'gpt-4o-realtime-preview-2024-12-17',
          voice: options.voice || 'verse',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI Realtime API error: ${errorData.error?.message || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating Realtime session:', error);
      throw error;
    }
  },

  /**
   * Convert text to speech
   * @param {string} text - Text to convert to speech
   * @param {object} options - TTS options (voice, format, etc.)
   * @returns {Promise<Buffer>} - Audio buffer
   */
  async textToSpeech(text, options = {}) {
    const response = await openai.audio.speech.create({
      model: options.model || 'tts-1',
      voice: options.voice || 'alloy',
      input: text,
      response_format: options.format || 'mp3',
    });

    // Get binary audio data
    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer;
  },

  /**
   * Convert speech to text
   * @param {Buffer} audioBuffer - Audio buffer
   * @param {object} options - STT options
   * @returns {Promise<string>} - Transcribed text
   */
  async speechToText(audioBuffer, options = {}) {
    // Get project's temp directory
    const fs = require('fs-extra');
    const path = require('path');
    const TEMP_DIR = path.join(__dirname, '../../temp');
    
    // Ensure temp directory exists
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
    
    // Create a temporary file for the audio with a unique name
    // Use .webm as a default, but the actual format doesn't matter to Whisper
    const tempFilePath = path.join(TEMP_DIR, `audio-${Date.now()}.webm`);
    
    try {
      // Write the buffer to a temporary file
      await fs.writeFile(tempFilePath, audioBuffer);
      
      // Create a File object from the temporary file
      const file = fs.createReadStream(tempFilePath);
      
      // Send to OpenAI API
      const response = await openai.audio.transcriptions.create({
        model: options.model || 'whisper-1',
        file: file,
        response_format: 'json',
        language: options.language || 'en',
      });
      
      // Clean up temporary file
      await fs.remove(tempFilePath);
      
      return response.text;
    } catch (error) {
      console.error('Error in speech-to-text processing:', error);
      
      // Clean up in case of error
      try {
        if (fs.existsSync(tempFilePath)) {
          await fs.remove(tempFilePath);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up temporary file:', cleanupError);
      }
      
      throw error;
    }
  }
};

module.exports = openaiService;
