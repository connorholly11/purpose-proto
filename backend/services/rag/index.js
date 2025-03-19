const openaiService = require('../openai');
const pineconeService = require('../pinecone');
const dbService = require('../database');

/**
 * Service for Retrieval Augmented Generation (RAG)
 */
const ragService = {
  /**
   * Process and store text for RAG
   * @param {string} text - Text to process and store
   * @param {object} metadata - Additional metadata for the text
   * @returns {Promise<object>} - Created vector entry
   */
  async indexText(text, metadata = {}) {
    try {
      // Generate embedding for the text
      const embedding = await openaiService.generateEmbedding(text);
      
      // Store in database for record keeping
      const vector = await dbService.vectors.create({
        content: text,
        embedding: JSON.stringify(embedding),
        metadata
      });
      
      // Store in Pinecone for semantic search
      await pineconeService.upsertVectors([{
        id: vector.id,
        values: embedding,
        metadata: {
          ...metadata,
          content: text
        }
      }]);
      
      return vector;
    } catch (error) {
      console.error('Error indexing text for RAG:', error);
      throw error;
    }
  },
  
  /**
   * Process and store multiple texts for RAG
   * @param {Array} items - Array of {text, metadata} objects
   * @returns {Promise<Array>} - Created vector entries
   */
  async batchIndexTexts(items) {
    try {
      // Extract texts for batch embedding
      const texts = items.map(item => item.text);
      
      // Generate embeddings for all texts at once
      const embeddings = await openaiService.generateEmbeddings(texts);
      
      // Prepare vector entries for database and Pinecone
      const vectors = [];
      const pineconeVectors = [];
      
      // Process each text and its embedding
      for (let i = 0; i < items.length; i++) {
        const { text, metadata } = items[i];
        const embedding = embeddings[i];
        
        // Store in database
        const vector = await dbService.vectors.create({
          content: text,
          embedding: JSON.stringify(embedding),
          metadata
        });
        
        vectors.push(vector);
        
        // Add to Pinecone vectors
        pineconeVectors.push({
          id: vector.id,
          values: embedding,
          metadata: {
            ...metadata,
            content: text
          }
        });
      }
      
      // Batch upsert to Pinecone
      if (pineconeVectors.length > 0) {
        await pineconeService.upsertVectors(pineconeVectors);
      }
      
      return vectors;
    } catch (error) {
      console.error('Error batch indexing texts for RAG:', error);
      throw error;
    }
  },
  
  /**
   * Find relevant context for a query
   * @param {string} query - User query
   * @param {number} maxResults - Maximum number of results to return
   * @param {object} filter - Optional filter criteria
   * @returns {Promise<string>} - Formatted context for inclusion in prompt
   */
  async getRelevantContext(query, maxResults = 3, filter = {}) {
    try {
      // Generate embedding for the query
      const queryEmbedding = await openaiService.generateEmbedding(query);
      
      // Search for similar vectors in Pinecone
      // Add a default filter if none is provided
      const pineconeFilter = Object.keys(filter).length > 0 ? filter : { type: "document" };
      
      const similarVectors = await pineconeService.querySimilar(
        queryEmbedding,
        maxResults,
        pineconeFilter
      );
      
      // Extract and format the context from the results
      if (similarVectors && similarVectors.length > 0) {
        const formattedContext = similarVectors
          .map((match, index) => {
            return `[Context ${index + 1}]: ${match.metadata.content}`;
          })
          .join('\n\n');
        
        return formattedContext;
      }
      
      return '';
    } catch (error) {
      console.error('Error getting relevant context for RAG:', error);
      // Return empty context on error, so the chat can still work without RAG
      return '';
    }
  },
  
  /**
   * Generate a response with RAG
   * @param {string} query - User query
   * @param {Array} conversationHistory - Previous messages
   * @param {string} systemPrompt - System prompt
   * @returns {Promise<object>} - Response with context used
   */
  async generateResponse(query, conversationHistory = [], systemPrompt) {
    try {
      // Get relevant context for the query
      const relevantContext = await this.getRelevantContext(query);
      
      // Create enhanced system prompt with context
      let enhancedSystemPrompt = systemPrompt;
      if (relevantContext) {
        enhancedSystemPrompt = `${systemPrompt}\n\nHere is some additional context that may be relevant to the user's query:\n${relevantContext}`;
      }
      
      // Generate completion with enhanced context
      const completion = await openaiService.generateChatCompletion(
        conversationHistory,
        enhancedSystemPrompt
      );
      
      return {
        response: completion.choices[0].message.content,
        model: completion.model,
        contextUsed: !!relevantContext,
        relevantContext
      };
    } catch (error) {
      console.error('Error generating RAG response:', error);
      throw error;
    }
  },
  
  /**
   * Add a document to the knowledge base
   * @param {string} content - Document content
   * @param {Object} metadata - Document metadata (title, source, etc.)
   * @returns {Promise<Object>} - Result with vector ID and status
   */
  async addDocument(content, metadata = {}) {
    try {
      // Generate embedding for the document
      const embedding = await openaiService.generateEmbedding(content);
      
      // Save to database
      const vector = await dbService.vectors.create({
        content,
        metadata
      });
      
      // Store in Pinecone
      await pineconeService.upsert({
        id: vector.id,
        values: embedding,
        metadata: {
          ...metadata,
          text: content
        }
      });
      
      return {
        success: true,
        id: vector.id
      };
    } catch (error) {
      console.error('Error adding document to knowledge base:', error);
      throw error;
    }
  },
};

module.exports = ragService;
