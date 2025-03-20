import { getCompletion } from './openai';
import { createUserKnowledgeItem, getUserKnowledgeItems } from './knowledgeService';

type Message = {
  role: string;
  content: string;
};

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