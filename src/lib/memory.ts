import { prisma } from './prisma';
import { callSummarizationLlmApi, Message as LlmMessage } from './llm';
import { Prisma } from '@prisma/client';

// Define the structure for the new user context data
export interface UserContextData {
  // Core understanding of the user
  core_understanding: {
    personality: string;        // Natural description of user's personality
    current_journey: string;    // What they're focused on/going through
    communication_style: string // How they interact and communicate
  };
  
  // How our relationship/understanding evolves
  relationship_patterns: {
    interaction_style: string;  // How we work together
    trust_development: string;  // How our rapport has developed
    engagement_patterns: string // What drives meaningful interactions
  };
  
  // Dynamic learning about the user
  evolving_insights: {
    recent_observations: string[];     // New patterns or understanding
    consistent_patterns: string[];     // Stable traits/preferences
    changing_patterns: string[];       // How they're evolving
  };

  // Technical necessities (these provide immediate context)
  last_update: string;               // When understanding was last deepened
}

// Define a default empty context
const defaultUserContext: UserContextData = {
  core_understanding: {
    personality: "",
    current_journey: "",
    communication_style: ""
  },
  relationship_patterns: {
    interaction_style: "",
    trust_development: "",
    engagement_patterns: ""
  },
  evolving_insights: {
    recent_observations: [],
    consistent_patterns: [],
    changing_patterns: []
  },
  last_update: new Date().toISOString()
};

/**
 * Format a user's recent conversation history into a simple transcript string.
 * @param userId The Clerk ID of the user
 * @param limit The number of messages to include
 * @returns Formatted transcript string
 */
async function formatMessagesForSummarization(userId: string, limit: number = 20): Promise<string> {
  try {
    // Fetch the user's most recent messages
    const messages = await prisma.message.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }, // Get the latest first
      take: limit,
    });

    if (messages.length === 0) {
      return "No recent conversation history available.";
    }

    // Reverse to get chronological order for the transcript
    messages.reverse();

    // Format into a readable transcript
    let transcript = "RECENT CONVERSATION TRANSCRIPT:\n\n";
    messages.forEach((message: { role: string; content: string }) => {
      const role = message.role.toUpperCase();
      transcript += `${role}: ${message.content}\n`; // Simplified format for summary prompt
    });

    return transcript;
  } catch (error) {
    console.error(`Error formatting messages for summarization for user ${userId}:`, error);
    throw new Error('Failed to format messages for summarization');
  }
}

/**
 * Create the LLM prompt for generating a short conversation summary.
 * @param transcript The recent conversation transcript
 * @returns The complete prompt string for the summarization LLM call.
 */
function createShortSummarizationPrompt(transcript: string): string {
  return `
Analyze the following recent conversation transcript:

${transcript}

INSTRUCTIONS:
Create a brief, natural summary of this conversation that captures:
1. Any meaningful insights about the user's personality or perspective
2. Key points discussed or topics explored
3. How the interaction pattern between you and the user flowed
4. Any noticeable shifts in the user's approach or engagement

Write in a natural, conversational style as if you were describing a conversation with a friend to another friend. Focus on patterns and insights rather than just facts. 

Respond ONLY with the summary text in 2-3 sentences.
`;
}

/**
 * Create the LLM prompt for pattern analysis of recent interactions.
 * This is the first LLM call in the two-step process.
 * @param transcript The recent conversation transcript
 * @returns The prompt for pattern analysis
 */
function createPatternAnalysisPrompt(transcript: string): string {
  return `
Analyze recent interactions with the user to identify meaningful patterns:

${transcript}

INSTRUCTIONS:
As an expert in understanding human communication and relationship development, analyze this conversation to identify:

1. Any new insights about the user's personality or preferences
2. How your interaction patterns with them are evolving
3. Changes in their current journey, focus, or priorities
4. Deepening understanding of their communication style

Focus on meaningful patterns rather than surface-level facts. Look for:
- Recurring themes in how they express themselves
- Emotional patterns or shifts
- How they approach problem-solving or decision-making
- Changes in openness, trust, or vulnerability
- Unique language patterns or expressions

Respond with a detailed analysis that goes beyond the obvious, focusing on the person behind the words.
`;
}

/**
 * Create a prompt for integrating pattern analysis into the existing user context.
 * This is the second LLM call in the two-step process.
 * @param patternAnalysis The result of the pattern analysis
 * @param currentContext The current user context data
 * @returns The prompt for natural integration
 */
function createIntegrationPrompt(patternAnalysis: string, currentContext: UserContextData): string {
  return `
Based on our existing understanding of the user and new insights, create an updated natural understanding:

PATTERN ANALYSIS:
${patternAnalysis}

CURRENT UNDERSTANDING:

CORE UNDERSTANDING:
Personality: ${currentContext.core_understanding.personality || 'Not yet established'}
Current Journey: ${currentContext.core_understanding.current_journey || 'Not yet established'}
Communication Style: ${currentContext.core_understanding.communication_style || 'Not yet established'}

RELATIONSHIP PATTERNS:
Interaction Style: ${currentContext.relationship_patterns.interaction_style || 'Not yet established'}
Trust Development: ${currentContext.relationship_patterns.trust_development || 'Not yet established'}
Engagement Patterns: ${currentContext.relationship_patterns.engagement_patterns || 'Not yet established'}

CONSISTENT PATTERNS:
${currentContext.evolving_insights.consistent_patterns.length > 0 
  ? currentContext.evolving_insights.consistent_patterns.map(p => `- ${p}`).join('\n')
  : 'None identified yet'}

INSTRUCTIONS:
Based on the pattern analysis and our existing understanding:
1. How has our understanding deepened?
2. What patterns are becoming clearer?
3. How is our interaction evolving?
4. What aspects of their journey are most relevant now?

Create a natural, integrated understanding of the user as if you're describing a friend's evolution to another friend. Return a JSON object with the following structure:

{
  "core_understanding": {
    "personality": "Natural description of user's personality traits, values, and characteristics",
    "current_journey": "What they're focused on, working through, or pursuing currently",
    "communication_style": "How they tend to express themselves and communicate"
  },
  "relationship_patterns": {
    "interaction_style": "How you and the user work together and interact",
    "trust_development": "How rapport and trust have developed between you",
    "engagement_patterns": "What topics or approaches drive meaningful engagement"
  },
  "evolving_insights": {
    "recent_observations": [
      "New pattern or insight observed in this conversation",
      "Another new observation if relevant"
    ],
    "consistent_patterns": [
      "Pattern that remains consistent with previous understanding",
      "Another consistent trait or preference"
    ],
    "changing_patterns": [
      "How the user seems to be evolving or changing",
      "Another area of evolution if relevant"
    ]
  }
}
`;
}

/**
 * Create a prompt for extracting structured user information.
 * @param transcript The conversation transcript to analyze
 * @param currentContext The current user context data
 * @returns The prompt string for extracting structured information
 */
function createStructuredExtractionPrompt(transcript: string, currentContext: UserContextData): string {
  return `
Analyze the following recent conversation transcript to deepen the understanding of the user:

${transcript}

Current understanding of the user:

CORE UNDERSTANDING:
Personality: ${currentContext.core_understanding.personality || 'Not yet established'}
Current Journey: ${currentContext.core_understanding.current_journey || 'Not yet established'}
Communication Style: ${currentContext.core_understanding.communication_style || 'Not yet established'}

RELATIONSHIP PATTERNS:
Interaction Style: ${currentContext.relationship_patterns.interaction_style || 'Not yet established'}
Trust Development: ${currentContext.relationship_patterns.trust_development || 'Not yet established'}
Engagement Patterns: ${currentContext.relationship_patterns.engagement_patterns || 'Not yet established'}

CONSISTENT PATTERNS:
${currentContext.evolving_insights.consistent_patterns.length > 0 
  ? currentContext.evolving_insights.consistent_patterns.map(p => `- ${p}`).join('\n')
  : 'None identified yet'}

INSTRUCTIONS:
Based on this conversation, analyze how our understanding of the user has evolved. Return a JSON object with the following structure:

{
  "core_understanding": {
    "personality": "Natural description of user's personality traits, values, and characteristics",
    "current_journey": "What they're focused on, working through, or pursuing currently",
    "communication_style": "How they tend to express themselves and communicate"
  },
  "relationship_patterns": {
    "interaction_style": "How you and the user work together and interact",
    "trust_development": "How rapport and trust have developed between you",
    "engagement_patterns": "What topics or approaches drive meaningful engagement"
  },
  "evolving_insights": {
    "recent_observations": [
      "New pattern or insight observed in this conversation",
      "Another new observation if relevant"
    ],
    "consistent_patterns": [
      "Pattern that remains consistent with previous understanding",
      "Another consistent trait or preference"
    ],
    "changing_patterns": [
      "How the user seems to be evolving or changing",
      "Another area of evolution if relevant"
    ]
  }
}

Focus on meaningful patterns rather than surface-level facts. Integrate existing context where relevant, and provide natural, insightful descriptions rather than mechanical observations.
`;
}

/**
 * Parse the JSON response from the structured extraction.
 * @param jsonResponse The JSON response from the LLM
 * @returns Parsed extraction data
 */
interface ExtractionData {
  core_understanding: {
    personality: string;
    current_journey: string;
    communication_style: string;
  };
  relationship_patterns: {
    interaction_style: string;
    trust_development: string;
    engagement_patterns: string;
  };
  evolving_insights: {
    recent_observations: string[];
    consistent_patterns: string[];
    changing_patterns: string[];
  };
}

function parseExtractionResponse(jsonResponse: string): ExtractionData {
  try {
    // Clean up potential markdown formatting
    let cleanJson = jsonResponse.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.substring(7);
    }
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.substring(3);
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.substring(0, cleanJson.length - 3);
    }
    
    // Parse the JSON
    const extractedData = JSON.parse(cleanJson) as ExtractionData;
    
    // Ensure all expected properties exist with defaults
    return {
      core_understanding: {
        personality: extractedData.core_understanding?.personality || "",
        current_journey: extractedData.core_understanding?.current_journey || "",
        communication_style: extractedData.core_understanding?.communication_style || ""
      },
      relationship_patterns: {
        interaction_style: extractedData.relationship_patterns?.interaction_style || "",
        trust_development: extractedData.relationship_patterns?.trust_development || "",
        engagement_patterns: extractedData.relationship_patterns?.engagement_patterns || ""
      },
      evolving_insights: {
        recent_observations: Array.isArray(extractedData.evolving_insights?.recent_observations) 
          ? extractedData.evolving_insights.recent_observations 
          : [],
        consistent_patterns: Array.isArray(extractedData.evolving_insights?.consistent_patterns) 
          ? extractedData.evolving_insights.consistent_patterns 
          : [],
        changing_patterns: Array.isArray(extractedData.evolving_insights?.changing_patterns) 
          ? extractedData.evolving_insights.changing_patterns 
          : []
      }
    };
  } catch (error) {
    console.error('Error parsing extraction response:', error);
    return {
      core_understanding: {
        personality: "",
        current_journey: "",
        communication_style: ""
      },
      relationship_patterns: {
        interaction_style: "",
        trust_development: "",
        engagement_patterns: ""
      },
      evolving_insights: {
        recent_observations: [],
        consistent_patterns: [],
        changing_patterns: []
      }
    };
  }
}

/**
 * Update the user's context based on recent conversation.
 * Implements the "Update Routine" using the two-step pattern analysis approach.
 * @param userId The Clerk ID of the user
 * @param trigger What triggered this update (e.g., 'message_count', 'manual')
 * @returns The updated StructuredSummary object
 */
export async function updateUserContext(userId: string, trigger: string = 'manual'): Promise<any> {
  // Create initial log entry
  const logEntry = await prisma.summarizationLog.create({
    data: {
      userId,
      status: 'started',
      trigger,
      updatedAt: new Date(),
    }
  });

  try {
    console.log(`Updating context for user ${userId} triggered by ${trigger}...`);

    // 1. Gather Information - Fetch the last 20 messages
    const messagesToSummarize = await prisma.message.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
    });
    messagesToSummarize.reverse(); // Chronological order

    // 2. Fetch current context or initialize
    const existingSummaryRecord = await prisma.structuredSummary.findUnique({
      where: { userId },
    });

    // Always unify with the default to avoid missing fields
    let currentContext: UserContextData = {
      ...defaultUserContext,
      ...(existingSummaryRecord?.summaryData ? existingSummaryRecord.summaryData as unknown as UserContextData : {}),
    };

    // Handle migration from old format to new format
    const isOldFormat = !('core_understanding' in currentContext) && 
                        (('preferences' in currentContext as any) || ('facts' in currentContext as any));
    
    if (isOldFormat) {
      const oldContext = currentContext as any;
      currentContext = {
        ...defaultUserContext,
        core_understanding: {
          personality: "",
          current_journey: "",
          communication_style: ""
        },
        relationship_patterns: {
          interaction_style: "",
          trust_development: "",
          engagement_patterns: ""
        },
        evolving_insights: {
          recent_observations: oldContext.preferences || [],
          consistent_patterns: oldContext.facts || [],
          changing_patterns: []
        },
        last_update: new Date().toISOString()
      };
    }

    // 3. Prepare transcript for both summarization and extraction
    const transcript = await formatMessagesForSummarization(userId, 20);
    
    // 4. First LLM Call: Pattern Analysis
    console.log(`Performing pattern analysis for user ${userId}...`);
    const patternPrompt = createPatternAnalysisPrompt(transcript);
    const patternAnalysis = await callSummarizationLlmApi(patternPrompt, false);
    
    // 5. Second LLM Call: Natural Integration
    console.log(`Integrating patterns into context for user ${userId}...`);
    const integrationPrompt = createIntegrationPrompt(patternAnalysis, currentContext);
    const integrationResponse = await callSummarizationLlmApi(integrationPrompt, true);
    const extractedInfo = parseExtractionResponse(integrationResponse);
    
    console.log(`Completed context update for ${userId}`);

    // 6. Update Context Data with natural integration
    const updatedContext = { ...currentContext }; // Create a mutable copy

    // Core Understanding: Integrate rather than replace
    if (extractedInfo.core_understanding.personality) {
      updatedContext.core_understanding.personality = extractedInfo.core_understanding.personality;
    }
    
    if (extractedInfo.core_understanding.current_journey) {
      updatedContext.core_understanding.current_journey = extractedInfo.core_understanding.current_journey;
    }
    
    if (extractedInfo.core_understanding.communication_style) {
      updatedContext.core_understanding.communication_style = extractedInfo.core_understanding.communication_style;
    }

    // Relationship Patterns: Integrate rather than replace
    if (extractedInfo.relationship_patterns.interaction_style) {
      updatedContext.relationship_patterns.interaction_style = extractedInfo.relationship_patterns.interaction_style;
    }
    
    if (extractedInfo.relationship_patterns.trust_development) {
      updatedContext.relationship_patterns.trust_development = extractedInfo.relationship_patterns.trust_development;
    }
    
    if (extractedInfo.relationship_patterns.engagement_patterns) {
      updatedContext.relationship_patterns.engagement_patterns = extractedInfo.relationship_patterns.engagement_patterns;
    }

    // Evolving Insights: Manage arrays carefully
    // Recent observations: Replace with new ones
    updatedContext.evolving_insights.recent_observations = extractedInfo.evolving_insights.recent_observations;
    
    // Consistent patterns: Add new ones while keeping existing (avoid duplicates)
    if (extractedInfo.evolving_insights.consistent_patterns.length > 0) {
      const consistentPatternsSet = new Set([
        ...updatedContext.evolving_insights.consistent_patterns,
        ...extractedInfo.evolving_insights.consistent_patterns
      ]);
      updatedContext.evolving_insights.consistent_patterns = Array.from(consistentPatternsSet);
      
      if (updatedContext.evolving_insights.consistent_patterns.length > 20) {
        updatedContext.evolving_insights.consistent_patterns = 
          updatedContext.evolving_insights.consistent_patterns.slice(-20);
      }
    }
    
    // Changing patterns: Replace with new ones
    updatedContext.evolving_insights.changing_patterns = extractedInfo.evolving_insights.changing_patterns;

    // Update the last_update timestamp
    updatedContext.last_update = new Date().toISOString();

    // 7. Save the updated context
    const updatedSummary = await prisma.structuredSummary.upsert({
      where: { userId },
      update: {
        summaryData: updatedContext as any, // Cast to any as Prisma expects Prisma.JsonValue
        updatedAt: new Date(),
      },
      create: {
        userId,
        summaryData: updatedContext as any, // Cast to any as Prisma expects Prisma.JsonValue
      },
    });

    console.log(`Context updated successfully for user ${userId}`);

    // 8. Update log entry to completed
    await prisma.summarizationLog.update({
      where: { id: logEntry.id },
      data: {
        status: 'completed',
        updatedAt: new Date(),
      }
    });

    return updatedSummary;
  } catch (error) {
    console.error(`Error updating context for user ${userId}:`, error);

    // Update log entry to failed with details
    await prisma.summarizationLog.update({
      where: { id: logEntry.id },
      data: {
        status: 'failed',
        details: error instanceof Error ? error.message : String(error),
        updatedAt: new Date(),
      }
    });

    throw error; // Re-throw the error after logging
  }
}

/**
 * Get the last N conversation messages for a user in LlmMessage format
 * @param userId The Clerk ID of the user
 * @param limit The number of messages to retrieve (default: 50)
 * @returns Array of messages in chronological order (oldest first)
 */
export async function getLastNMessages(userId: string, limit = 50): Promise<LlmMessage[]> {
  try {
    // Fetch the latest messages
    const messages = await prisma.message.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    
    // Reverse to get chronological order (oldest first)
    messages.reverse();
    
    // Convert to LlmMessage format
    return messages.map((msg: any) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));
  } catch (error) {
    console.error(`Error retrieving last ${limit} messages for user ${userId}:`, error);
    return [];
  }
}

/**
 * Get messages from a specific time-based conversation for a user
 * @param userId The Clerk ID of the user
 * @param conversationStartTime The timestamp when the conversation started
 * @returns Array of messages in chronological order (oldest first)
 */
export async function getConversationMessages(userId: string, conversationStartTime: Date): Promise<LlmMessage[]> {
  try {
    console.log(`[Memory Service] Retrieving conversation messages since ${conversationStartTime.toISOString()} for user ${userId}`);
    
    // Fetch messages after the specified timestamp for this conversation
    const messages = await prisma.message.findMany({
      where: { 
        userId,
        createdAt: { gte: conversationStartTime }
      },
      orderBy: { createdAt: 'asc' },
    });
    
    console.log(`[Memory Service] Found ${messages.length} messages in this conversation`);
    
    if (messages.length > 0) {
      // Log some timing info about the conversation
      const firstMessageTime = new Date(messages[0].createdAt).getTime();
      const lastMessageTime = new Date(messages[messages.length-1].createdAt).getTime();
      const conversationDuration = lastMessageTime - firstMessageTime;
      
      console.log(`[Memory Service] Conversation timing:
      - First message: ${new Date(messages[0].createdAt).toISOString()}
      - Latest message: ${new Date(messages[messages.length-1].createdAt).toISOString()}
      - Conversation duration: ${conversationDuration}ms (${Math.round(conversationDuration/1000/60)} minutes)`);
      
      // Count the distribution of message roles
      const userMessages = messages.filter((m: any) => m.role === 'user').length;
      const assistantMessages = messages.filter((m: any) => m.role === 'assistant').length;
      console.log(`[Memory Service] Message distribution: ${userMessages} user, ${assistantMessages} assistant`);
    }
    
    // Convert to LlmMessage format
    const llmMessages = messages.map((msg: any) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));
    
    return llmMessages;
  } catch (error) {
    console.error(`[Memory Service] Error retrieving conversation messages for user ${userId} since ${conversationStartTime}:`, error);
    return [];
  }
}

/**
 * Format the user context data into a readable string for injection into the main LLM prompt.
 * @param contextData The structured user context data.
 * @returns Formatted string representation of the context.
 */
export function formatContextForPrompt(contextData: UserContextData | null): string {
  console.log('[Memory Service] Formatting user context for prompt injection');
  
  if (!contextData) {
    console.log('[Memory Service] No user context data available');
    return "SYSTEM_NOTE: No user context available yet. Start a fresh conversation.";
  }

  try {
    // Handle potential old format data during migration
    if (!('core_understanding' in contextData)) {
      console.log('[Memory Service] Detected old format user context data, handling migration case');
      return "SYSTEM_NOTE: User context is currently being migrated to a new format. Proceed normally.";
    }
    
    console.log('[Memory Service] User context data structure is valid');
    
    // Log some data about the context
    console.log(`[Memory Service] Context data overview:
    - Has personality info: ${Boolean(contextData.core_understanding.personality)}
    - Has journey info: ${Boolean(contextData.core_understanding.current_journey)}
    - Has communication style info: ${Boolean(contextData.core_understanding.communication_style)}
    - Recent observations: ${contextData.evolving_insights.recent_observations.length}
    - Consistent patterns: ${contextData.evolving_insights.consistent_patterns.length}
    - Last updated: ${contextData.last_update || 'Unknown'}`)

    // Format the context in a natural, narrative form
    let formattedContext = "USER_CONTEXT_START\n\n";

    // Core Understanding Section
    formattedContext += "Core Understanding:\n";
    if (contextData.core_understanding.personality) {
      formattedContext += `${contextData.core_understanding.personality}. `;
    }
    
    if (contextData.core_understanding.current_journey) {
      formattedContext += `They're currently focused on ${contextData.core_understanding.current_journey}. `;
    }
    
    if (contextData.core_understanding.communication_style) {
      formattedContext += `Their conversations tend to be ${contextData.core_understanding.communication_style}.`;
    }
    formattedContext += "\n\n";

    // Relationship Dynamic Section
    formattedContext += "Relationship Dynamic:\n";
    const hasDynamicInfo = contextData.relationship_patterns.interaction_style || 
                          contextData.relationship_patterns.trust_development || 
                          contextData.relationship_patterns.engagement_patterns;
    
    if (hasDynamicInfo) {
      if (contextData.relationship_patterns.interaction_style) {
        formattedContext += `Our interactions ${contextData.relationship_patterns.interaction_style}. `;
      }
      
      if (contextData.relationship_patterns.trust_development) {
        formattedContext += `We've developed a rapport that ${contextData.relationship_patterns.trust_development}. `;
      }
      
      if (contextData.relationship_patterns.engagement_patterns) {
        formattedContext += `They engage most deeply when ${contextData.relationship_patterns.engagement_patterns}.`;
      }
    } else {
      formattedContext += "Our relationship is still developing.";
    }
    formattedContext += "\n\n";

    // Recent Insights Section
    const hasInsights = contextData.evolving_insights.recent_observations.length > 0 || 
                       contextData.evolving_insights.consistent_patterns.length > 0 || 
                       contextData.evolving_insights.changing_patterns.length > 0;
    
    if (hasInsights) {
      formattedContext += "Recent Insights:\n";
      
      // Recent observations (new patterns)
      if (contextData.evolving_insights.recent_observations.length > 0) {
        formattedContext += "I've recently noticed ";
        contextData.evolving_insights.recent_observations.forEach((observation: string, index: number) => {
          if (index > 0) {
            formattedContext += index === contextData.evolving_insights.recent_observations.length - 1 
              ? ", and " 
              : ", ";
          }
          formattedContext += observation.toLowerCase();
        });
        formattedContext += ". ";
      }
      
      // Consistent patterns (stable traits)
      if (contextData.evolving_insights.consistent_patterns.length > 0) {
        formattedContext += "They consistently ";
        const samplePatterns = contextData.evolving_insights.consistent_patterns.slice(0, 3);
        samplePatterns.forEach((pattern: string, index: number) => {
          if (index > 0) {
            formattedContext += index === samplePatterns.length - 1 
              ? ", and " 
              : ", ";
          }
          formattedContext += pattern.toLowerCase();
        });
        
        if (contextData.evolving_insights.consistent_patterns.length > 3) {
          formattedContext += `, among other patterns`;
        }
        formattedContext += ". ";
      }
      
      // Changing patterns (evolution)
      if (contextData.evolving_insights.changing_patterns.length > 0) {
        formattedContext += "Their approach seems to be evolving toward ";
        contextData.evolving_insights.changing_patterns.forEach((change: string, index: number) => {
          if (index > 0) {
            formattedContext += index === contextData.evolving_insights.changing_patterns.length - 1 
              ? ", and " 
              : ", ";
          }
          formattedContext += change.toLowerCase();
        });
        formattedContext += ".";
      }
      formattedContext += "\n\n";
    }

    formattedContext += "USER_CONTEXT_END\n";

    if (formattedContext === "USER_CONTEXT_START\n\nUSER_CONTEXT_END\n") {
      console.log('[Memory Service] Generated context is empty, returning error note');
      return "SYSTEM_NOTE: User context is currently empty.";
    }

    // Count paragraphs and approximate tokens
    const paragraphs = formattedContext.split('\n\n').length;
    const words = formattedContext.split(/\s+/).length;
    const approximateTokens = Math.round(words * 1.3); // rough estimate
    
    console.log(`[Memory Service] Generated user context summary:
    - Length: ${formattedContext.length} characters
    - Paragraphs: ${paragraphs}
    - Words: ${words}
    - Approximate tokens: ${approximateTokens}
    `);
    
    return formattedContext;
  } catch (error) {
    console.error('[Memory Service] Error formatting context for prompt:', error);
    return "SYSTEM_ERROR: Error retrieving user context. Proceed with caution.";
  }
}