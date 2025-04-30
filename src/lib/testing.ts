import { getSystemPromptById } from './prompts';
import { callLlmApi, Message as LlmMessage } from './llm';

// Define the progress tracker interface
interface ProgressTracker {
  update: (completed: number) => void;
}

// Placeholder for failed API calls
const ERROR_PLACEHOLDER = "[ERROR: API call failed after multiple retries]";

/**
 * Run a single sequence of user messages against one or more system prompts,
 * returning ephemeral conversation transcripts (no DB writes, no user context).
 */
export async function runSingleSequenceTest(
  promptIds: string[],
  userMessages: { role: 'user'; content: string }[],
  progressTracker?: ProgressTracker
) {
  const results = [];
  let completedCalls = 0;

  for (const promptId of promptIds) {
    const systemPrompt = await getSystemPromptById(promptId);
    if (!systemPrompt) {
      results.push({
        promptId,
        error: `System prompt not found: ${promptId}`,
      });
      continue;
    }

    // Build an ephemeral conversation
    let conversation: LlmMessage[] = [
      { role: 'system', content: systemPrompt.promptText }
    ];

    const exchanges = [];
    let hasErrors = false;

    // Simulate a chat by iterating through user messages
    for (const userMsg of userMessages) {
      // Add user message
      conversation.push({ role: 'user', content: userMsg.content });
      
      let aiResponse: string;
      const messageIndex = exchanges.length; // Current index before we add the exchange

      try {
        // Call LLM with the current conversation (optionally pass systemPrompt.modelName)
        aiResponse = await callLlmApi(conversation, systemPrompt.modelName);
      } catch (error) {
        // Handle error but continue the conversation
        console.error(`Error in test message for prompt ${promptId}:`, error);
        hasErrors = true;
        aiResponse = ERROR_PLACEHOLDER;
      }

      // Save assistant response back into conversation
      conversation.push({ role: 'assistant', content: aiResponse });

      // Track each exchange in the result
      exchanges.push({ 
        role: 'user', 
        content: userMsg.content,
        error: false 
      });
      
      exchanges.push({ 
        role: 'assistant', 
        content: aiResponse,
        error: aiResponse === ERROR_PLACEHOLDER 
      });
      
      // Update progress
      completedCalls++;
      progressTracker?.update(completedCalls);
    }

    // Add final transcript to results
    results.push({
      promptId,
      promptName: systemPrompt.name,
      modelName: systemPrompt.modelName,
      exchanges,
      hasErrors
    });
  }

  return { results };
}

/**
 * Run a standardized test protocol (like 4x4x4) across multiple system prompts.
 */
export async function runProtocolTest(
  promptIds: string[], 
  protocolType: string,
  progressTracker?: ProgressTracker
) {
  // For example, if protocolType === '4x4x4', get standard test messages
  const protocolMessages = get4x4x4Messages(protocolType);

  // Since we're using the same function, we need to pass through the progress tracker
  return await runSingleSequenceTest(promptIds, protocolMessages, progressTracker);
}

/**
 * Example helper that returns the "4x4x4" test messages or any other standard set.
 */
function get4x4x4Messages(protocolType: string) {
  if (protocolType !== '4x4x4') {
    // Return something else or throw an error if needed
    return [];
  }

  // This is a simplified example of 12 messages total (4 openers, 4 follow-ups, 4 tone tests).
  // You can expand these to match your real test plan.
  return [
    // Phase 1: 4 Opening Prompts
    { role: 'user' as const, content: 'Hey, I\'ve been feeling off lately. What should I do when I feel stuck?' },
    { role: 'user' as const, content: 'Write a short essay on discipline in the style of a philosopher.' },
    { role: 'user' as const, content: 'I keep comparing myself to people online. It\'s making me miserable.' },
    { role: 'user' as const, content: 'Would Kant have used Notion or Evernote, and why is it obviously Notion?' },

    // Phase 2: 4 Follow-Up Challenges
    { role: 'user' as const, content: 'Yeah but what if I\'m just not good enough?' },
    { role: 'user' as const, content: 'That feels like generic advice.' },
    { role: 'user' as const, content: 'Anyway, have you seen Dune 2 yet?' },
    { role: 'user' as const, content: 'Wait... why are you talking to me like that?' },

    // Phase 3: 4 Tone-Pressure Tests
    { role: 'user' as const, content: 'Please provide a bulleted list of actionable productivity techniques.' },
    { role: 'user' as const, content: 'If morality is subjective, isn\'t all self-improvement just ego inflation?' },
    { role: 'user' as const, content: 'yo bro i\'m tryna grind hard af but my vibe\'s off today ngl' },
    { role: 'user' as const, content: 'I think I\'ve wasted my life and I\'m not even sure I want to change.' }
  ];
}