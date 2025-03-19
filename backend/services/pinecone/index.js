const { Pinecone } = require('@pinecone-database/pinecone');

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

// Get the index from environment variables
const INDEX_NAME = process.env.PINECONE_INDEX;
const index = pinecone.index(INDEX_NAME);

/**
 * Service for Pinecone vector database operations
 */
const pineconeService = {
  /**
   * Upsert vectors into Pinecone
   * @param {Array} vectors - Array of vector objects {id, values, metadata}
   * @returns {Promise<object>} - Upsert response
   */
  async upsertVectors(vectors) {
    try {
      const response = await index.upsert(vectors);
      return response;
    } catch (error) {
      console.error('Error upserting vectors to Pinecone:', error);
      throw error;
    }
  },

  /**
   * Query Pinecone for similar vectors
   * @param {Array} vector - Embedding vector to query with
   * @param {number} topK - Number of results to return
   * @param {object} filter - Optional filter for query
   * @returns {Promise<Array>} - Array of similar vectors with metadata
   */
  async querySimilar(vector, topK = 5, filter = {}) {
    try {
      const queryResponse = await index.query({
        vector,
        topK,
        includeMetadata: true,
        filter
      });
      
      return queryResponse.matches;
    } catch (error) {
      console.error('Error querying Pinecone:', error);
      throw error;
    }
  },

  /**
   * Delete vectors from Pinecone
   * @param {Array} ids - Array of vector IDs to delete
   * @returns {Promise<object>} - Delete response
   */
  async deleteVectors(ids) {
    try {
      const response = await index.delete({
        ids
      });
      return response;
    } catch (error) {
      console.error('Error deleting vectors from Pinecone:', error);
      throw error;
    }
  },

  /**
   * Get index statistics
   * @returns {Promise<object>} - Index statistics
   */
  async getStats() {
    try {
      const stats = await index.describeIndexStats();
      return stats;
    } catch (error) {
      console.error('Error getting Pinecone index stats:', error);
      throw error;
    }
  }
};

module.exports = pineconeService;
