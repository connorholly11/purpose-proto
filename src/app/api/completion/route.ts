import { NextRequest, NextResponse } from 'next/server';
import { getCompletion } from '@/lib/services/openai';
import { createMessage } from '@/lib/services/prisma';
import logger from '@/lib/utils/logger';
import { extractKnowledgeFromMessage } from '@/lib/services/extraction';
import { shouldSummarize, createMemorySummary, getMessagesSinceLastSummary } from '@/lib/services/memoryService';
import { queryDocuments } from '@/lib/services/pinecone';

export async function POST(req: NextRequest) {
  const requestId = `api-completion-${Date.now()}`;
  try {
    logger.info('API', 'Completion request received', { requestId });
    
    // Parse request body
    const body = await req.json();
    const { messages, context, conversationId, userId } = body;
    
    logger.debug('API', 'Completion request details', { 
      requestId,
      messageCount: messages?.length || 0,
      hasContext: !!context,
      contextLength: context?.length || 0,
      conversationId: conversationId || 'none',
      userId: userId || 'none'
    });
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      logger.warn('API', 'Invalid completion request - missing messages', { requestId });
      return NextResponse.json(
        { error: 'Invalid request, messages are required' },
        { status: 400 }
      );
    }

    let ragContext = context;
    
    // If userId is provided, try to fetch relevant knowledge
    if (userId) {
      try {
        // Fetch additional context from RAG for more relevant responses
        const userQuery = messages[messages.length - 1].content;
        logger.info('API', 'Querying user knowledge base', { requestId, userId });
        
        const ragMatches = await queryDocuments(userQuery, 5, userId);
        
        // Use a lower similarity threshold for identity queries
        const isIdentityQuery = userQuery.toLowerCase().includes("who am i") || 
                                userQuery.toLowerCase().includes("about me") || 
                                userQuery.toLowerCase().includes("know about me") || 
                                userQuery.toLowerCase().includes("what do you know");

        // Use different thresholds based on query type
        const relevantItems = isIdentityQuery 
          ? ragMatches // Include all for identity queries
          : ragMatches.filter(match => match.score > 0.65);
        
        if (relevantItems.length > 0) {
          logger.info('API', 'Found relevant items in user knowledge base', { 
            requestId, 
            count: relevantItems.length,
            isIdentityQuery
          });
          
          // Format knowledge in a more structured way
          let knowledgeSection = "";
          
          if (isIdentityQuery) {
            // For identity queries, separate into explicit "User Information" section
            knowledgeSection = "USER INFORMATION:\n" + 
              relevantItems.map(item => `• ${item.content}`).join('\n');
            
            // Include original knowledge context format too
            const knowledgeContext = relevantItems.map(item => item.content).join('\n\n');
            ragContext = context 
              ? `${context}\n\n${knowledgeSection}\n\n${knowledgeContext}` 
              : `${knowledgeSection}\n\n${knowledgeContext}`;
          } else {
            // For regular queries, maintain original format
            const knowledgeContext = relevantItems.map(item => item.content).join('\n\n');
            ragContext = context 
              ? `${context}\n\nUser Knowledge:\n${knowledgeContext}` 
              : `User Knowledge:\n${knowledgeContext}`;
          }
          
          logger.debug('API', 'Added user knowledge to context', {
            requestId,
            contextLength: ragContext.length,
            knowledgeItems: relevantItems.length,
            isIdentityQuery
          });
        }
      } catch (ragError) {
        logger.error('API', 'Error fetching user knowledge', {
          requestId,
          error: (ragError as Error).message,
          userId
        });
        // Continue processing even if user knowledge retrieval fails
      }
    }
    
    // Get completion with context
    logger.debug('API', 'Calling getCompletion', { requestId });
    const startTime = Date.now();
    const answer = await getCompletion(messages, ragContext);
    const duration = Date.now() - startTime;
    
    // Log to database if conversationId is provided
    if (conversationId) {
      try {
        logger.debug('API', 'Logging messages to database', { 
          requestId,
          conversationId,
          userMessageLength: messages[messages.length - 1].content.length,
          assistantMessageLength: answer.length
        });
        
        // Log user message
        const userMessage = await createMessage({
          conversationId,
          role: 'user',
          content: messages[messages.length - 1].content,
        });
        
        // Log assistant response
        await createMessage({
          conversationId,
          role: 'assistant',
          content: answer,
        });
        
        logger.info('API', 'Messages logged to database', { 
          requestId,
          conversationId 
        });
        
        // Extract knowledge from user message if userId is provided
        if (userId) {
          try {
            logger.debug('API', 'Extracting knowledge from user message', {
              requestId,
              messageId: userMessage.id,
              userId
            });
            
            // Don't await to avoid delaying the response
            extractKnowledgeFromMessage(userMessage, userId).catch(err => {
              logger.error('API', 'Error extracting knowledge', {
                requestId,
                error: (err as Error).message,
                userId
              });
            });
          } catch (extractionError) {
            logger.error('API', 'Error initiating knowledge extraction', {
              requestId,
              error: (extractionError as Error).message,
              userId
            });
          }
        }
        
        // Check if conversation should be summarized
        try {
          const needsSummary = await shouldSummarize(
            conversationId,
            60 * 60 * 1000, // 1 hour instead of 2 hours
            5 // 5 messages instead of 10
          );
          
          if (needsSummary) {
            logger.info('API', 'Conversation needs summarization', {
              requestId,
              conversationId
            });
            
            // Get messages to summarize
            const messagesToSummarize = await getMessagesSinceLastSummary(conversationId);
            
            if (messagesToSummarize.length > 0) {
              // Don't await to avoid delaying the response
              createMemorySummary(conversationId, messagesToSummarize, 'short_term').catch(err => {
                logger.error('API', 'Error creating memory summary', {
                  requestId,
                  error: (err as Error).message,
                  conversationId
                });
              });
            }
          }
        } catch (summaryError) {
          logger.error('API', 'Error checking for conversation summarization', {
            requestId,
            error: (summaryError as Error).message,
            conversationId
          });
        }
      } catch (err) {
        logger.error('API', 'Error logging messages to database', { 
          requestId,
          conversationId,
          error: (err as Error).message
        });
        // Continue even if logging fails
      }
    }
    
    logger.info('API', 'Completion request completed', { 
      requestId,
      duration,
      answerLength: answer.length
    });
    
    return NextResponse.json({ answer });
  } catch (error) {
    logger.error('API', 'Error in completion API', { 
      requestId,
      error: (error as Error).message
    });
    return NextResponse.json(
      { error: 'Error generating completion' },
      { status: 500 }
    );
  }
} 