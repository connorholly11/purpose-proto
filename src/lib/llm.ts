import { GoogleGenAI } from '@google/genai';

// Message type definition
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMResponse {
  reply: string;
}

// Helper function for delay between retries
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Define a retryable function that wraps API calls
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, delayMs = 1000): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${attempt}/${maxRetries} failed. ${error instanceof Error ? error.message : String(error)}`);
      
      // If this was the last attempt, don't wait
      if (attempt < maxRetries) {
        // Exponential backoff: wait longer between successive retries
        const waitTime = delayMs * Math.pow(1.5, attempt - 1);
        console.log(`Waiting ${waitTime}ms before retry...`);
        await sleep(waitTime);
      }
    }
  }
  
  // If we get here, all retries failed
  throw lastError;
}

// Reusable function to call OpenAI (existing logic)
async function callOpenAiApi(messages: Message[], model: string): Promise<string> {
  return withRetry(async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    console.log(`OpenAI API Call: Using model ${model}`);
    console.log(`OpenAI Request: ${JSON.stringify(messages, null, 2).substring(0, 300)}...`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    if (
      !data.choices ||
      !data.choices[0] ||
      !data.choices[0].message ||
      !data.choices[0].message.content
    ) {
      console.error('Unexpected LLM API response structure:', data);
      throw new Error('Unexpected LLM API response structure.');
    }
    
    console.log(`OpenAI Response: Tokens used: ${data.usage?.total_tokens || 'unknown'}`);
    
    return data.choices[0].message.content.trim();
  });
}

/**
 * callAnthropicApi
 * @param messages - Chat messages array
 * @param model    - e.g. "claude-3-5-sonnet-20241022"
 * @returns        - The model's string completion
 */
async function callAnthropicApi(messages: Message[], model: string): Promise<string> {
  return withRetry(async () => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
    }

    console.log(`Anthropic API Call: Using model ${model}`);
    console.log(`Anthropic Request: ${JSON.stringify(messages, null, 2).substring(0, 300)}...`);

    // Extract system messages and non-system messages
    let systemPrompt: string | undefined;
    const nonSystemMessages = messages.filter(message => {
      if (message.role === 'system') {
        // Store the system prompt (use the first one if multiple)
        if (!systemPrompt) {
          systemPrompt = message.content;
        }
        return false; // Filter out system messages
      }
      return true; // Keep non-system messages
    });

    // Build the Anthropic-compatible payload
    const anthropicPayload: any = {
      model,
      max_tokens: 1500,
      messages: nonSystemMessages,
    };

    // Add system as a top-level parameter if present
    if (systemPrompt) {
      anthropicPayload.system = systemPrompt;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(anthropicPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    // Anthropic returns an array in data.content for the assistant's message blocks
    // We'll extract the text from the first block or join them if multiple
    const contentBlocks = data.content || [];
    if (!Array.isArray(contentBlocks) || contentBlocks.length === 0) {
      console.error('Unexpected Anthropic API response structure:', data);
      return '';
    }

    console.log(`Anthropic Response: Input tokens: ${data.usage?.input_tokens || 'unknown'}, Output tokens: ${data.usage?.output_tokens || 'unknown'}`);

    // Typically data.content[0].text is the chunk
    const firstBlock = contentBlocks[0];
    if (!firstBlock.text) {
      return '';
    }
    return String(firstBlock.text).trim();
  });
}

/**
 * callDeepSeekApi
 * @param messages - Chat messages array
 * @param model    - e.g. "deepseek-chat" for DeepSeek v3
 * @returns        - The model's string completion
 */
async function callDeepSeekApi(messages: Message[], model: string): Promise<string> {
  return withRetry(async () => {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY is not set in environment variables');
    }

    console.log(`DeepSeek API Call: Using model ${model}`);
    console.log(`DeepSeek Request: ${JSON.stringify(messages, null, 2).substring(0, 300)}...`);

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    if (
      !data.choices ||
      !data.choices[0] ||
      !data.choices[0].message ||
      !data.choices[0].message.content
    ) {
      console.error('Unexpected DeepSeek API response structure:', data);
      throw new Error('Unexpected DeepSeek API response structure.');
    }
    
    console.log(`DeepSeek Response: Cache hit tokens: ${data.usage?.prompt_cache_hit_tokens || 'unknown'}, Cache miss tokens: ${data.usage?.prompt_cache_miss_tokens || 'unknown'}, Output tokens: ${data.usage?.completion_tokens || 'unknown'}`);
    
    return data.choices[0].message.content.trim();
  });
}

/**
 * Calls the Gemini API with the provided messages
 * @param messages Array of Message objects
 * @param model The Gemini model to use (e.g., "gemini-2.5-pro-preview-03-25")
 * @returns The text response from Gemini
 */
async function callGeminiApi(messages: Message[], model: string): Promise<string> {
  return withRetry(async () => {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is not set in environment variables');
    }

    console.log(`Gemini API Call: Using model ${model}`);
    console.log(`Gemini Request: ${JSON.stringify(messages, null, 2).substring(0, 300)}...`);

    // Initialize the Google Generative AI client
    const ai = new GoogleGenAI({ apiKey });
    
    // Extract system message and user message
    const systemMessage = messages.find(msg => msg.role === 'system');
    const userMessage = messages.find(msg => msg.role === 'user');

    if (!userMessage) {
      throw new Error('No user message found');
    }

    // Create content for generation
    let content = userMessage.content;
    let config: any = {
      temperature: 0.7,
      maxOutputTokens: 1500,
    };

    // Add system instruction if available
    if (systemMessage) {
      config.systemInstruction = systemMessage.content;
    }

    // Configure the model to use reduced temperature for JSON responses
    if (systemMessage && systemMessage.content.includes('Respond ONLY with valid JSON')) {
      // For JSON output, use a lower temperature for more predictability
      config.temperature = 0.2;
    }
    
    // Call the Gemini API
    const response = await ai.models.generateContent({
      model,
      contents: content,
      config
    });

    // Extract the text response
    let responseText = response.text || '';
    
    console.log(`Gemini Response (truncated): ${responseText.substring(0, 100)}...`);
    
    // Clean up response - Gemini sometimes returns markdown-formatted JSON with ```json tags
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/^```json\n/, '').replace(/```$/, '');
    } else if (responseText.includes('```json')) {
      // Handle case where there might be text before the JSON block
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        responseText = jsonMatch[1];
      }
    }
    
    return responseText.trim();
  });
}

/**
 * Normalize model name to ensure consistent usage across the app
 * @param modelName The model name to normalize
 * @returns The normalized model name
 */
function normalizeModelName(modelName: string): string {
  // Map legacy model names to their updated versions
  if (modelName === 'gpt-4o') {
    return 'chatgpt-4o-latest';
  }
  
  // Map DeepSeek model names
  if (modelName === 'deepseek-v3') {
    return 'deepseek-chat';
  }

  // No need to map Gemini model names as we use the exact model ID
  
  return modelName;
}

/**
 * callLlmApi
 * @param messages - conversation messages
 * @param modelOverride - optionally override the default model
 * @returns the text response from the selected LLM
 */
export async function callLlmApi(messages: Message[], modelOverride?: string): Promise<string> {
  let model = modelOverride ?? process.env.CHAT_LLM_MODEL ?? 'chatgpt-4o-latest';
  model = normalizeModelName(model);
  
  console.log('\n===== LLM API REQUEST =====');
  console.log(`Model: ${model}`);
  
  // Determine which API to use based on the model name
  let apiProvider = 'OpenAI';
  if (model.toLowerCase().includes('claude')) {
    apiProvider = 'Anthropic';
  } else if (model.toLowerCase().includes('deepseek')) {
    apiProvider = 'DeepSeek';
  } else if (model.toLowerCase().includes('gemini')) {
    apiProvider = 'Gemini';
  }
  
  console.log(`Using API: ${apiProvider}`);
  console.log(`Messages count: ${messages.length}`);
  console.log(`System message length: ${messages[0]?.content.length || 0} chars`);
  console.log(`Conversation history: ${messages.length - 2} messages`); // Subtract system and user message
  console.log(`User message: ${messages[messages.length - 1].content.substring(0, 100)}${messages[messages.length - 1].content.length > 100 ? '...' : ''}`);
  
  // Print token estimate if DEBUG_TOKEN_ESTIMATE is enabled
  if (process.env.DEBUG_TOKEN_ESTIMATE === 'true') {
    // Very rough estimate: ~4 chars per token
    const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    const estimatedTokens = Math.ceil(totalChars / 4);
    console.log(`Estimated tokens (rough): ~${estimatedTokens}`);
  }

  try {
    let response;
    if (apiProvider === 'Anthropic') {
      console.log('Routing to Anthropic API...');
      response = await callAnthropicApi(messages, model);
    } else if (apiProvider === 'DeepSeek') {
      console.log('Routing to DeepSeek API...');
      response = await callDeepSeekApi(messages, model);
    } else if (apiProvider === 'Gemini') {
      console.log('Routing to Gemini API...');
      response = await callGeminiApi(messages, model);
    } else {
      console.log('Routing to OpenAI API...');
      response = await callOpenAiApi(messages, model);
    }
    
    console.log('\n===== LLM API RESPONSE =====');
    console.log(`Response length: ${response.length} characters`);
    console.log(`Response preview: ${response.substring(0, 100)}${response.length > 100 ? '...' : ''}`);
    console.log('=============================\n');
    
    return response;
  } catch (error) {
    console.error('Error calling LLM API after all retries:', error);
    throw error;
  }
}

/**
 * Call the LLM specifically for generating summaries or structured data.
 * This still defaults to the Summarization model from env, but you can
 * add logic here if you want to use Claude for summarization too.
 */
export async function callSummarizationLlmApi(
  prompt: string, 
  expectJson: boolean = true, 
  overrideModel?: string
): Promise<string> {
  let model = overrideModel ?? (process.env.SUMMARIZATION_LLM_MODEL || process.env.CHAT_LLM_MODEL || 'chatgpt-4o-latest');
  model = normalizeModelName(model);
  
  // We'll build the request messages
  const messages: Message[] = [
    {
      role: 'system',
      content: expectJson
        ? 'You are an AI assistant that specializes in analyzing conversations and extracting structured information. Respond ONLY with valid JSON according to the specified format.'
        : 'You are an AI assistant skilled at concisely summarizing conversations based on provided transcripts and instructions.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  // Determine which API to use based on the model name
  if (model.toLowerCase().includes('claude')) {
    return await callAnthropicApi(messages, model);
  } else if (model.toLowerCase().includes('deepseek')) {
    return await callDeepSeekApi(messages, model);
  } else if (model.toLowerCase().includes('gemini')) {
    return await callGeminiApi(messages, model);
  } else {
    return await callOpenAiApi(messages, model);
  }
}