# AI Companion Memory System

## Overview

This project implements an AI companion with advanced memory capabilities, personal knowledge management, and contextual understanding. The system is designed to create human-like interactions by remembering details about users across conversations and using that information to provide personalized responses.

## Core Components

### 1. Retrieval-Augmented Generation (RAG)

Our RAG system enhances the AI's responses by providing relevant context from:

- User-specific knowledge (personal facts, preferences, interests)
- Conversation history and memory summaries
- External data sources (when applicable)

The RAG pipeline follows these steps:
1. User messages are vectorized using embeddings
2. Relevant information is retrieved from vector databases (Pinecone)
3. Retrieved information is injected into the AI's context
4. The AI generates responses informed by this additional context

### 2. Memory Management

The system implements a multi-level memory architecture:

- **Short-term memory**: Recent conversation turns (5-8 messages)
- **Medium-term memory**: Conversation summaries created periodically
- **Long-term memory**: Persistent knowledge about the user stored in knowledge base

Memory summarization happens automatically when:
- A conversation reaches 5+ messages since the last summary
- An hour has passed since the last summary
- The user asks a question that requires historical context

### 3. Knowledge Extraction

The system automatically extracts personal information shared by users during conversations:

- Personal facts (location, occupation, age)
- Preferences (likes, dislikes, favorites)
- Relationships (family members, friends, pets)
- Interests and hobbies
- Goals and aspirations

Extraction happens in real-time after each user message using:
- Semantic analysis of message content
- Pattern recognition for personal facts
- Storage in a persistent knowledge base

### 4. Personalized AI Responses

The AI companion leverages memory and knowledge to:

- Address users with appropriate familiarity
- Reference past conversations and shared experiences
- Incorporate personal details into responses naturally
- Answer identity questions ("What do you know about me?")
- Provide more relevant and contextual suggestions

## Technical Implementation

### Vector Database Integration

- **Pinecone**: Used for storing and retrieving vector embeddings
- Custom similarity scoring that boosts relevance of personal information
- Special handling for identity-related queries to prioritize personal facts

### Memory Summarization

- OpenAI's GPT-4 generates periodic summaries of conversations
- Summaries are stored with embeddings for semantic retrieval
- Multiple summary types (short/medium/long-term) with different priorities

### Knowledge Management

- Personal information is stored in a structured knowledge base
- Knowledge items are vectorized for semantic retrieval
- De-duplication prevents storage of redundant information
- Aggressive extraction ensures even implied information is captured

### API and Frontend Components

- RESTful API endpoints for conversation, memory, and knowledge management
- React-based UI with real-time message handling
- Debug panels for monitoring memory and knowledge extraction
- Conversation visualization with memory indicators

## Current Implementations and Improvements

### Recently Implemented Features

1. **Enhanced Personal Information Extraction**:
   - More generous extraction thresholds
   - Conversion of implicit information to explicit facts
   - Structured formatting for better retrieval

2. **Improved Identity Query Handling**:
   - Special detection for "what do you know about me" type queries
   - Inclusion of ALL knowledge items for identity queries
   - Boosted relevance scores for personal information

3. **Dynamic Context Management**:
   - Structured formatting of user information in context
   - Explicit USER INFORMATION sections for clearer reference
   - Varying thresholds based on query type

4. **Memory Optimization**:
   - More frequent summarization (5 messages vs 10)
   - Reduced time intervals between summaries (1 hour vs 2 hours)
   - Prioritization of personal details in memory

5. **System Prompt Engineering**:
   - More assertive prompting for using available information
   - Emphasis on acknowledging any available personal facts
   - Instructions to never claim ignorance if facts exist

### Planned Improvements

1. **Advanced Conversation Analysis**:
   - Sentiment analysis for emotional context
   - Topic tracking across conversations
   - Contradiction detection for knowledge consistency

2. **Multi-Modal Memory**:
   - Support for images, audio, and other media types
   - Cross-modal knowledge linkage

3. **Active Knowledge Refinement**:
   - Proactive questioning to fill knowledge gaps
   - Confidence scoring for extracted information
   - Temporal awareness for outdated information

4. **Improved Knowledge Visualization**:
   - User-facing visualization of AI's knowledge
   - Timeline of memory formation and usage
   - Explicit control over remembered information

## Technical Architecture

The system is built with a modern serverless architecture:

- **Frontend**: Next.js with React components
- **Backend**: API routes in Next.js handling various services
- **Database**: Prisma with PostgreSQL for structured data
- **Vector Storage**: Pinecone for embeddings and semantic search
- **AI Provider**: OpenAI's GPT-4 and embedding models
- **Logging**: Structured logging throughout the pipeline

## Evaluation and Testing

The memory system can be evaluated based on:

1. **Recall Accuracy**: How accurately the system recalls personal information
2. **Retrieval Relevance**: How relevant the retrieved information is to the query
3. **Natural Integration**: How naturally personal details are integrated into responses
4. **User Satisfaction**: How users perceive the personalization

Test scenarios include:
- Identity verification questions
- Temporal questions about past conversations
- Queries requiring synthesis of multiple knowledge items
- Implicit references to previously shared information

## Conclusion

This AI companion system with enhanced memory capabilities aims to create more natural, personalized, and contextually aware interactions. By implementing a multi-level memory architecture with automatic knowledge extraction and sophisticated retrieval mechanisms, the AI can build and maintain a rich understanding of each user, enhancing the quality and relevance of its responses over time. 