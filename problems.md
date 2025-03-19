# RAG and Embedding Implementation Problems

## Current Status

We've been working on implementing and troubleshooting RAG (Retrieval-Augmented Generation) functionality in the AI Voice Companion. The key issues that need to be addressed are:

1. **Next.js dynamic route params warning**: Needs to be fixed in conversation routes
2. **Per-user knowledge base**: Need to implement and visualize user-specific knowledge bases
3. **System prompt testing**: Need UI and analytics for evaluating system prompts
4. **Navigation structure**: RAG analytics should be a top-level navigation item
5. **Feedback capture mechanism**: Need simple ways to gather user feedback
6. **Performance monitoring**: Track response times, token usage, and costs

## Issues and Solutions

### 1. Next.js Dynamic Route Params Warning

We're seeing warnings in the conversation route:
```
Error: Route "/api/conversation/[id]" used `params.id`. `params` should be awaited before using its properties.
```

This needs to be fixed by updating the route handlers to properly await params.

### 2. Per-user Knowledge Base

Since this is an AI companion app, we need a way to build and maintain personalized knowledge for each user:

- Each user should have their own knowledge base that grows over time
- The RAG system should prioritize user-specific knowledge in responses
- The RAG analytics page should display user knowledge bases with:
  - Topics/categories of knowledge
  - Sources of information (conversations, uploads, etc.)
  - Usage frequency of knowledge items
  - Ability to edit/remove items from the knowledge base

Currently, this functionality is missing from both the implementation and the analytics UI.

### 3. System Prompt Testing

We need a way to test and evaluate different system prompts to improve the quality of the AI companion:

- Chat UI should display the current system prompt being used
- Add like/dislike buttons next to responses to rate system prompt effectiveness
- Create a separate section in the logs page specifically for system prompts showing:
  - System prompt text
  - Like/dislike counts
  - Associated conversations in a dropdown view
  - Performance metrics
- Enable A/B testing of system prompts with different users
- Store and analyze which system prompts lead to better user experiences

This will help us iteratively improve the AI companion's personality and helpfulness.

### 4. Navigation Structure

The current navigation structure needs to be updated:

- RAG analytics should be a top-level navigation item, not nested under Admin
- The main navigation should include these items in this order:
  1. Chat
  2. Logs
  3. Admin
  4. Test RAG
  5. RAG Analytics

This will improve accessibility to RAG analytics and create a more logical information architecture.

### 5. Feedback Capture Mechanism

As a prototype for founders and testing, we need better ways to capture feedback:

- Add a general feedback form accessible from any page in the app
- Implement session recording (with appropriate permissions) to see how users interact
- Create a dedicated feedback panel that can be toggled with a hotkey
- Allow categorization of feedback (UI/UX, AI responses, voice quality, etc.)
- Provide a way to attach screenshots or recordings to feedback
- Aggregate feedback in the admin dashboard for easy review

This will help gather valuable insights during the prototype phase and improve iteration speed.

### 6. Performance Monitoring

We need to track key performance metrics to optimize the system:

- Create a dashboard to display:
  - Response times (embedding generation, RAG queries, completions)
  - Token usage per conversation and user
  - Cost estimates based on API usage
  - Voice processing metrics (latency, quality)
- Implement historical tracking to see performance changes over time
- Add filters to analyze performance by user, feature, or time period
- Create exportable reports for stakeholder presentations

This will help optimize the system and provide transparency into operational costs.

## Server-Side API Architecture Implemented

- Created dedicated server-side API endpoints for all database operations
- Moved all Prisma client usage to server-side components
- Implemented proper error handling and logging in API routes

## Next Steps

1. **Fix Next.js Dynamic Route Params**
   - Update `/api/conversation/[id]/route.ts` to properly await params
   - Fix any other routes using dynamic parameters

2. **Implement Per-User Knowledge Base**
   - Create database schema for user knowledge items
   - Develop API endpoints for managing knowledge bases
   - Modify RAG pipeline to include user-specific knowledge
   - Update the RAG analytics page to display and manage user knowledge

3. **Add System Prompt Testing Framework**
   - Modify chat UI to display current system prompt
   - Add like/dislike controls for prompt evaluation
   - Create database schema for storing prompt feedback
   - Develop analytics dashboard for system prompt performance
   - Implement API endpoints for retrieving and analyzing prompt data

4. **Update Navigation Structure**
   - Move RAG analytics from Admin section to the main navigation
   - Ensure the navigation order follows the specified sequence
   - Update mobile navigation to maintain consistency

5. **Implement Feedback Capture System**
   - Create feedback form component that can be accessed globally
   - Set up database schema for storing structured feedback
   - Develop admin interface for reviewing and responding to feedback
   - Implement optional session recording functionality

6. **Build Performance Monitoring Dashboard**
   - Set up metrics collection for API calls and response times
   - Create visualization components for token usage and costs
   - Implement historical data storage for trend analysis
   - Design exportable reports for stakeholder meetings 