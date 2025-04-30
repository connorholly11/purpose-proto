# Gemini API Integration

## Overview
This document outlines how to use the Google Gemini API in our application, particularly for evaluation/grading purposes.

## Installation
```bash
npm install @google/genai
```

## Configuration
Set the following environment variables in your `.env` file:
```
GOOGLE_API_KEY=your_google_api_key
SUMMARIZATION_LLM_MODEL=gemini-2.5-pro-preview-03-25  # For using Gemini as grading model
```

## Basic Usage
```typescript
import { GoogleGenAI } from '@google/genai';

// Initialize the client
const ai = new GoogleGenAI({ apiKey });

// For a simple text completion
const response = await ai.models.generateContent({
  model: 'gemini-2.5-pro-preview-03-25',
  contents: prompt,
  config: {
    temperature: 0.7,
    maxOutputTokens: 1500
  }
});
const text = response.text;
```

## Chat Interface
```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: "GEMINI_API_KEY" });

// Create a chat session
const chat = ai.chats.create({
  model: "gemini-2.5-pro-preview-03-25",
  history: [
    {
      role: "user",
      parts: [{ text: "Hello" }],
    },
    {
      role: "model",
      parts: [{ text: "Great to meet you. What would you like to know?" }],
    },
  ],
});

// Send a message
const response1 = await chat.sendMessage({
  message: "How can you help me with evaluations?",
});
console.log("Chat response:", response1.text);
```

## Current Implementation in Purpose App

In our application, Gemini is primarily used for:

1. **Evaluation/Grading**: We use `gemini-2.5-pro-preview-03-25` to evaluate conversations between users and AI assistants, providing structured feedback and scoring.

2. **API Integration**: The integration is handled in `llmService.ts` with the `callGeminiApi` function.

## JSON Response Handling

When expecting structured JSON responses (like in evaluation):

```typescript
// Setting up expectations for JSON output
const messages = [
  { 
    role: 'system', 
    content: 'You are an AI assistant that specializes in analyzing conversations and extracting structured information. Respond ONLY with valid JSON according to the specified format.'
  },
  {
    role: 'user',
    content: prompt
  }
];

// Call the API
const resultJson = await ai.models.generateContent({
  model: "gemini-2.5-pro-preview-03-25",
  contents: prompt,
  config: {
    systemInstruction: systemPrompt,
    temperature: 0.2, // Lower temperature for more predictable JSON output
    maxOutputTokens: 2000
  }
});

// Parse the response
const structuredData = JSON.parse(resultJson.text);
```

## Model Capabilities and Limitations

- **Token Limits**: Gemini 2.5 Pro has context windows of approximately 1 million tokens
- **Strengths**: Strong performance in structured reasoning tasks, which makes it well-suited for evaluation
- **Format Control**: Good at following instructions for structured outputs (JSON, etc.)