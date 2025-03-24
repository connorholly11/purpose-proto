import { getCompletion } from './openai';
import { createUserKnowledgeItem, getUserKnowledgeItems } from './knowledgeService';
import { getOpenAIClient } from './openai';
import { Message } from '@prisma/client';
import logger from '@/lib/utils/logger';

type ExtractionResult = {
  informationExtracted: boolean;
  facts: { type: string; value: string }[];
  error?: string;
};

/**
 * Extracts user information from a conversation
 * @param messages The conversation messages
 * @param userId The ID of the user
 * @returns Extraction results with found facts
 */
export async function extractUserInformation(
  messages: Message[],
  userId: string
): Promise<ExtractionResult> {
  try {
    // Get existing knowledge to avoid duplication
    const existingKnowledge = await getUserKnowledgeItems(userId);
    const existingFacts = existingKnowledge.map(item => item.content);
    
    // Prepare the messages for the extraction
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.content).join('\n');
    if (!userMessages.trim()) {
      return { informationExtracted: false, facts: [] };
    }
    
    // Create a special system prompt for extraction
    const systemPrompt = {
      role: 'system',
      content: `Extract user information from the following text. 
      Focus on personal details, preferences, and facts about the user.
      Return a JSON object with the format: 
      { "informationExtracted": boolean, "facts": [ { "type": string, "value": string } ] }
      Only extract clear factual information, not guesses or assumptions.`
    };
    
    // Get the extraction from OpenAI
    const extractionResponse = await getCompletion([
      systemPrompt,
      { role: 'user', content: userMessages }
    ]);
    
    // Parse the response
    const extraction = JSON.parse(extractionResponse) as ExtractionResult;
    
    // If no information was extracted, return early
    if (!extraction.informationExtracted || extraction.facts.length === 0) {
      return { informationExtracted: false, facts: [] };
    }
    
    // Filter out facts that already exist in the knowledge base
    const newFacts = extraction.facts.filter(fact => {
      const factString = `${fact.type}: ${fact.value}`;
      const isDuplicate = existingFacts.some(existing => 
        existing.toLowerCase().includes(factString.toLowerCase()) ||
        // Check for similar facts with minor differences in formatting
        existing.toLowerCase().includes(`${fact.type.toLowerCase()}: ${fact.value.toLowerCase()}`) ||
        existing.toLowerCase().includes(`${fact.type.toLowerCase()}:${fact.value.toLowerCase()}`)
      );
      return !isDuplicate;
    });
    
    // Save new facts to the knowledge base
    for (const fact of newFacts) {
      await createUserKnowledgeItem(
        userId,
        `${fact.type}: ${fact.value}`
      );
    }
    
    return {
      informationExtracted: newFacts.length > 0,
      facts: newFacts
    };
  } catch (error) {
    console.error('Error extracting user information:', error);
    return {
      informationExtracted: false,
      facts: [],
      error: error instanceof Error ? error.message : 'Unknown error during extraction'
    };
  }
}

/**
 * Extracts personal information from a user message and adds it to their knowledge base
 */
export async function extractKnowledgeFromMessage(
  message: Message,
  userId: string
): Promise<void> {
  if (message.role !== 'user') return;
  
  try {
    logger.info('Extraction', 'Analyzing message for personal information', {
      messageId: message.id,
      userId,
      contentLength: message.content.length
    });
    
    const openai = getOpenAIClient();
    
    // Call OpenAI to extract personal information
    const result = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a knowledge extraction system specialized in identifying FACTUAL personal information.
          
          Analyze the user's message and extract any personal information they share about themselves. 
          This includes but is not limited to:
          - Personal facts (name, location, age, occupation)
          - Preferences (likes, dislikes, favorites)
          - Biographical information (where they're from, family, education)
          - Interests and hobbies
          - Important relationships (family members, pets)
          - Goals and aspirations
          
          FORMAT INSTRUCTIONS:
          For each piece of factual information, extract it as a CLEAR, STANDALONE FACT that can be referenced later.
          Format as a JSON array of objects with a 'content' field for each fact.
          
          IMPORTANT: Be GENEROUS in your extraction. If information is implied or reasonably inferred, include it.
          Convert statements into clear factual form.
          
          Examples:
          - "I grew up in California" → {"content": "The user grew up in California"}
          - "Basketball is my favorite sport" → {"content": "The user's favorite sport is basketball"}
          - "My sister Sydney is visiting next week" → {"content": "The user has a sister named Sydney"}
          - "I don't like horror movies" → {"content": "The user dislikes horror movies"}
          
          Include EVERY possible fact, even small details. If no personal information is found, return an empty array: []`
        },
        {
          role: 'user',
          content: message.content
        }
      ],
      response_format: { type: 'json_object' }
    });
    
    const extractionResponse = result.choices[0].message.content;
    if (!extractionResponse) {
      logger.info('Extraction', 'No extraction response received', { messageId: message.id });
      return;
    }
    
    try {
      const extractedItems = JSON.parse(extractionResponse);
      
      if (!Array.isArray(extractedItems) || extractedItems.length === 0) {
        logger.info('Extraction', 'No knowledge items extracted', { messageId: message.id });
        return;
      }
      
      logger.info('Extraction', 'Knowledge items extracted', { 
        messageId: message.id,
        count: extractedItems.length
      });
      
      // Add each knowledge item to the user's knowledge base
      for (const item of extractedItems) {
        if (typeof item.content === 'string' && item.content.trim()) {
          await createUserKnowledgeItem(userId, item.content);
          logger.info('Extraction', 'Knowledge item added to knowledge base', {
            userId,
            content: item.content
          });
        }
      }
    } catch (parseError) {
      logger.error('Extraction', 'Error parsing extraction response', {
        error: (parseError as Error).message,
        messageId: message.id,
        response: extractionResponse
      });
    }
  } catch (error) {
    logger.error('Extraction', 'Error extracting knowledge from message', {
      error: (error as Error).message,
      messageId: message.id,
      userId
    });
  }
}

/**
 * Updates the user's knowledge base from a conversation
 */
export async function updateKnowledgeBaseFromConversation(
  messages: Message[],
  userId: string
): Promise<void> {
  logger.info('Extraction', 'Updating knowledge base from conversation', {
    userId,
    messageCount: messages.length
  });
  
  // Process each user message to extract knowledge
  for (const message of messages) {
    if (message.role === 'user') {
      await extractKnowledgeFromMessage(message, userId);
    }
  }
} 