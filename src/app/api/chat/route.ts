import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { callLlmApi, Message as LlmMessage } from '@/lib/llm';
import { getActiveSystemPrompt, getSystemPromptById, getUserActiveSystemPrompt } from '@/lib/prompts';
import { formatContextForPrompt, updateUserContext, UserContextData, getLastNMessages, getConversationMessages } from '@/lib/memory';

// Interface for debug info to ensure TS knows about added fields
interface DebugInfo {
  timestamp: Date;
  systemPromptUsedId: string;
  systemPromptUsedName: string;
  summaryContextInjected: string | null;
  modelName?: string;
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  messages?: {
    userMessagePreview?: string;
    aiResponsePreview?: string;
  };
  conversation?: {
    id?: string;
    isNewConversation?: boolean;
    messageCount?: number;
    totalPromptMessages?: number;
  };
  costEstimate?: number;
}

// The POST route handler for chat
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check if user is authenticated
    const { userId } = auth();
    
    if (!userId) {
      console.log('Unauthorized request: No userId from auth()');
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }
    
    // Parse the request JSON
    const body = await request.json();
    
    // Extract message and options from the request body
    const { 
      message, 
      overridePromptId,
      requestDebugInfo = false,
      useContext = true,
      conversationId = null 
    } = body;
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    console.log(`Processing chat request from user ${userId}`);
    console.log(`Conversation ID: ${conversationId || 'new'}`);
    console.log(`Message length: ${message.length} characters`);
    console.log(`Override prompt ID: ${overridePromptId || 'none'}`);
    console.log(`Use context: ${useContext}`);
    
    let isNewConversation = false;
    let actualConversationId = conversationId;
    
    if (!actualConversationId) {
      // No conversation ID provided, create a new conversation
      const newConversation = await prisma.conversation.create({
        data: {
          userId,
        },
      });
      actualConversationId = newConversation.id;
      isNewConversation = true;
      console.log(`Created new conversation with ID: ${actualConversationId}`);
    }
    
    // Determine system prompt to use (override, user active, or global default)
    let systemPrompt;
    let systemPromptId;
    let systemPromptName;
    
    if (overridePromptId) {
      // Use the specified system prompt ID if provided
      systemPrompt = await getSystemPromptById(overridePromptId);
      if (!systemPrompt) {
        return NextResponse.json(
          { error: 'Specified system prompt not found' },
          { status: 404 }
        );
      }
      systemPromptId = systemPrompt.id;
      systemPromptName = systemPrompt.title;
      console.log(`Using override system prompt: ${systemPromptName} (${systemPromptId})`);
    } else {
      // Try to get the user's active system prompt
      systemPrompt = await getUserActiveSystemPrompt(userId);
      
      // If no user active prompt, fall back to the global default
      if (!systemPrompt) {
        systemPrompt = await getActiveSystemPrompt();
        
        if (!systemPrompt) {
          return NextResponse.json(
            { error: 'No active system prompt found' },
            { status: 500 }
          );
        }
      }
      
      systemPromptId = systemPrompt.id;
      systemPromptName = systemPrompt.title;
      console.log(`Using system prompt: ${systemPromptName} (${systemPromptId})`);
    }
    
    // Get or create the user's context
    let userContext: UserContextData | null = null;
    
    if (useContext) {
      try {
        // Try to get existing conversation context
        userContext = await prisma.userContext.findUnique({
          where: { userId },
          select: {
            id: true,
            lastUpdated: true,
            structuredData: true,
          },
        });
        
        if (userContext?.structuredData) {
          console.log(`Found existing user context, last updated: ${userContext.lastUpdated}`);
        } else {
          console.log('No existing user context found');
        }
      } catch (error) {
        console.error('Error fetching user context:', error);
        // Continue without context on error
      }
    }
    
    // Store user message in the database
    await prisma.message.create({
      data: {
        content: message,
        role: 'user',
        userId,
        conversationId: actualConversationId,
      },
    });
    
    // Prepare the messages for the LLM
    const messages: LlmMessage[] = [
      {
        role: 'system',
        content: systemPrompt.prompt,
      }
    ];
    
    // Add context from user history if available and enabled
    let contextPrompt = '';
    if (useContext && userContext?.structuredData) {
      contextPrompt = await formatContextForPrompt(userContext.structuredData);
      
      if (contextPrompt) {
        // Add the context as an additional system message
        messages.push({
          role: 'system',
          content: contextPrompt,
        });
        
        console.log(`Added user context to prompt (${contextPrompt.length} chars)`);
      }
    }
    
    // Get conversation history (last few messages) if this is an existing conversation
    if (!isNewConversation) {
      try {
        // Get up to 10 most recent messages from this conversation
        const conversationHistory = await getConversationMessages(actualConversationId, 10);
        
        // Add them to the messages array
        conversationHistory.forEach(msg => {
          messages.push({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          });
        });
        
        console.log(`Added ${conversationHistory.length} messages from conversation history`);
      } catch (error) {
        console.error('Error fetching conversation history:', error);
        // Continue without history if there's an error
      }
    }
    
    // Add the current user message
    messages.push({
      role: 'user',
      content: message,
    });
    
    // Call the LLM with the specified model
    const modelToUse = systemPrompt.modelName || undefined;
    console.log(`Using model: ${modelToUse || 'default from env'}`);
    
    const llmResponse = await callLlmApi(messages, modelToUse);
    
    // Store assistant response in the database
    const assistantMessage = await prisma.message.create({
      data: {
        content: llmResponse,
        role: 'assistant',
        userId,
        conversationId: actualConversationId,
      },
    });
    
    // Update user context asynchronously (don't await so we can respond quickly)
    if (useContext) {
      updateUserContext(userId, message, llmResponse)
        .then(() => console.log('User context updated'))
        .catch(err => console.error('Error updating user context:', err));
    }
    
    // Prepare the response
    const result: any = {
      reply: llmResponse,
      conversationId: actualConversationId,
      isNewConversation,
    };
    
    // Add debug info if requested
    if (requestDebugInfo) {
      // Get the token estimates
      // This would ideally come from the LLM provider, but we'll estimate here
      const totalPromptChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
      const responseChars = llmResponse.length;
      
      // Very rough estimate: ~4 chars per token for English
      const promptTokens = Math.ceil(totalPromptChars / 4);
      const completionTokens = Math.ceil(responseChars / 4);
      const totalTokens = promptTokens + completionTokens;
      
      // Calculate an estimated cost - these rates are approximations
      // You would adjust these based on your actual models and pricing
      let costEstimate = 0;
      if (modelToUse?.includes('claude')) {
        // Claude pricing (~$3 per million input tokens, ~$15 per million output tokens)
        costEstimate = (promptTokens / 1000000 * 3) + (completionTokens / 1000000 * 15);
      } else {
        // GPT-4 pricing (~$10 per million tokens input, ~$30 per million tokens output)
        costEstimate = (promptTokens / 1000000 * 10) + (completionTokens / 1000000 * 30);
      }
      
      const debugInfo: DebugInfo = {
        timestamp: new Date(),
        systemPromptUsedId: systemPromptId,
        systemPromptUsedName: systemPromptName,
        summaryContextInjected: contextPrompt,
        modelName: modelToUse,
        tokenUsage: {
          promptTokens,
          completionTokens,
          totalTokens
        },
        messages: {
          userMessagePreview: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
          aiResponsePreview: llmResponse.substring(0, 100) + (llmResponse.length > 100 ? '...' : '')
        },
        conversation: {
          id: actualConversationId,
          isNewConversation,
          messageCount: messages.length,
          totalPromptMessages: messages.length
        },
        costEstimate
      };
      
      result.debugInfo = debugInfo;
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    
    return NextResponse.json({
      error: 'Failed to process chat message',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}