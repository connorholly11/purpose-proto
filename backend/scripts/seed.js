/**
 * Seed script for the AI Companion application
 * Populates the database with test users, conversations, and RAG data
 */

const { PrismaClient } = require('@prisma/client');
const openaiService = require('../services/openai');
const pineconeService = require('../services/pinecone');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

// Sample knowledge base content
const knowledgeBase = [
  {
    title: "AI Companion Features",
    content: "The AI Companion app features both text and voice interactions, using OpenAI's GPT-4o for generating responses, Whisper for speech-to-text, and TTS-1 for text-to-speech. It includes conversation management, RAG for better context awareness, and a modern responsive UI."
  },
  {
    title: "Technical Architecture",
    content: "The application uses a Next.js frontend with Express.js backend. It uses Prisma ORM with a Supabase PostgreSQL database, OpenAI for AI capabilities, and Pinecone for vector storage in the RAG implementation."
  },
  {
    title: "User Experience",
    content: "The UI features a conversation sidebar for managing chats, a mode selector for switching between friendly and challenging AI personalities, and both text and voice input options for user interaction."
  },
  {
    title: "Deployment Strategy",
    content: "The backend is designed to be deployed on Heroku while the frontend can be deployed on Vercel. The application uses environment variables to securely store API keys and configuration."
  },
  {
    title: "Future Development",
    content: "Future plans include implementing real-time voice streaming, adding voice activity detection, improving the admin dashboard with analytics, and enhancing the RAG capabilities with more knowledge sources."
  }
];

// Sample conversations (one per user)
const sampleConversations = [
  {
    title: "Getting Started with AI",
    messages: [
      { role: "user", content: "Hi, can you tell me about yourself?" },
      { role: "assistant", content: "Hello! I'm your AI Companion, designed to assist you with information, answer questions, and engage in meaningful conversations. I'm powered by OpenAI's GPT-4o model and enhanced with retrieval-augmented generation for more accurate responses. How can I help you today?", llmUsed: "gpt-4o" },
      { role: "user", content: "What features do you have?" },
      { role: "assistant", content: "I have several key features:\n\n1. Text-based conversation with memory of our chat history\n2. Voice interaction through speech-to-text and text-to-speech\n3. Two personality modes: friendly (supportive) and challenging (critical thinking)\n4. Knowledge retrieval to enhance my responses with relevant information\n5. Conversation management so you can save and revisit our chats\n\nIs there a specific feature you'd like to know more about?", llmUsed: "gpt-4o" }
    ]
  },
  {
    title: "Technical Questions",
    messages: [
      { role: "user", content: "How does RAG work in this application?" },
      { role: "assistant", content: "In this application, Retrieval Augmented Generation (RAG) works through several key steps:\n\n1. **Content Indexing**: Text documents are broken into chunks and converted to vector embeddings using OpenAI's embedding model, then stored in Pinecone.\n\n2. **Query Processing**: When you ask a question, your query is also converted to an embedding vector.\n\n3. **Similarity Search**: The system searches Pinecone for document chunks with vectors most similar to your query vector.\n\n4. **Context Enhancement**: The most relevant chunks are retrieved and added to the context sent to the LLM.\n\n5. **Response Generation**: The GPT-4o model generates a response based on both your question and the retrieved relevant context.\n\nThis approach helps me provide more accurate, grounded answers that incorporate specific knowledge from our database. Would you like to know more about any specific part of this process?", llmUsed: "gpt-4o" },
      { role: "user", content: "What's the benefit of this approach?" },
      { role: "assistant", content: "The benefits of using RAG (Retrieval Augmented Generation) include:\n\n1. **Reduced Hallucinations**: By grounding responses in retrieved facts, I'm less likely to generate incorrect information.\n\n2. **Up-to-date Knowledge**: The system can be updated with new information without retraining the entire model.\n\n3. **Domain Specificity**: I can access specialized knowledge specific to your needs or organization.\n\n4. **Transparency**: Retrieved sources can be cited, making responses more verifiable.\n\n5. **Efficiency**: Smaller, focused knowledge retrieval is more cost-effective than constantly increasing model parameters.\n\n6. **Context Management**: It helps overcome context window limitations by only including the most relevant information.\n\nThis approach combines the creative generation capabilities of LLMs with the accuracy and specificity of information retrieval systems.", llmUsed: "gpt-4o" }
    ]
  },
  {
    title: "Voice Technology Discussion",
    messages: [
      { role: "user", content: "Tell me about the voice technology used here" },
      { role: "assistant", content: "The voice technology in this AI Companion application utilizes OpenAI's advanced models for both speech recognition and synthesis:\n\n**For Speech-to-Text (STT):**\n- Uses OpenAI's Whisper model, which is a highly accurate speech recognition system\n- Handles various accents, background noise, and technical language\n- Processes audio uploaded from your microphone recordings\n\n**For Text-to-Speech (TTS):**\n- Leverages OpenAI's TTS-1 model for natural-sounding speech synthesis\n- Uses the 'alloy' voice by default, which offers a neutral, clear speaking style\n- Converts my text responses into audio that's played back through your device\n\nThe implementation includes a simple voice recording interface that allows you to speak your messages rather than typing them. The current version processes complete recordings, though future updates aim to implement real-time streaming for a more conversational experience.", llmUsed: "gpt-4o" },
      { role: "user", content: "Could this be improved?" },
      { role: "assistant", content: "Yes, there are several ways the voice technology could be improved:\n\n1. **Real-time Voice Streaming**: Implementing streaming STT and TTS would create a more natural conversation flow without waiting for complete recordings.\n\n2. **Voice Activity Detection**: Adding smart detection of when you start and stop speaking would eliminate manual recording controls.\n\n3. **Voice Customization**: Offering multiple TTS voices or even voice cloning options would personalize the experience.\n\n4. **Offline Capabilities**: Adding lightweight local models for basic voice functions would improve reliability.\n\n5. **Emotion Recognition**: Detecting emotional tones in speech could help provide more appropriate responses.\n\n6. **Multi-speaker Support**: Distinguishing between different speakers would enable group conversations.\n\n7. **Accent Adaptation**: Fine-tuning the STT for your specific accent would improve transcription accuracy.\n\n8. **Latency Optimization**: Reducing processing time would make interactions feel more immediate.\n\nMany of these improvements are on the roadmap for future development.", llmUsed: "gpt-4o" }
    ]
  }
];

/**
 * Main seed function
 */
async function seed() {
  try {
    console.log('🌱 Starting seed process...');

    // Create users
    console.log('Creating users...');
    const users = await Promise.all([
      prisma.user.upsert({
        where: { id: 'user-connor' },
        update: {},
        create: {
          id: 'user-connor',
          name: 'Connor',
          email: 'connor@example.com'
        }
      }),
      prisma.user.upsert({
        where: { id: 'user-raj' },
        update: {},
        create: {
          id: 'user-raj',
          name: 'Raj',
          email: 'raj@example.com'
        }
      }),
      prisma.user.upsert({
        where: { id: 'user-mark' },
        update: {},
        create: {
          id: 'user-mark',
          name: 'Mark',
          email: 'mark@example.com'
        }
      })
    ]);
    
    console.log(`✅ Created ${users.length} users`);

    // Create RAG knowledge base with embeddings
    console.log('Creating knowledge base and embeddings...');
    
    for (const item of knowledgeBase) {
      console.log(`Processing knowledge item: ${item.title}`);
      
      // Generate embedding
      const embedding = await openaiService.generateEmbedding(item.content);
      
      // Store in database
      const vector = await prisma.vector.create({
        data: {
          content: item.content,
          metadata: {
            title: item.title,
            source: 'seed-script'
          }
        }
      });
      
      // Store in Pinecone
      await pineconeService.upsertVectors([{
        id: vector.id,
        values: embedding,
        metadata: {
          title: item.title,
          source: 'seed-script',
          text: item.content
        }
      }]);
      
      console.log(`✅ Added knowledge item: ${item.title}`);
    }

    // Create sample conversations
    console.log('Creating sample conversations...');
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const conversationData = sampleConversations[i];
      
      console.log(`Creating conversation for ${user.name}: ${conversationData.title}`);
      
      // Create conversation
      const conversation = await prisma.conversation.create({
        data: {
          title: conversationData.title,
          userId: user.id
        }
      });
      
      // Create messages
      for (const msgData of conversationData.messages) {
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: msgData.role,
            content: msgData.content,
            llmUsed: msgData.llmUsed
          }
        });
      }
      
      console.log(`✅ Added conversation: ${conversationData.title}`);
    }

    console.log('🎉 Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seed();
