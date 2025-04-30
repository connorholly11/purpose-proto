import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  // Get the list of founder/admin clerk IDs from environment
  const founderClerkIds = process.env.FOUNDER_CLERK_IDS?.split(',') || [];
  
  if (founderClerkIds.length === 0) {
    console.warn('No FOUNDER_CLERK_IDS found in the environment variables. Seeding skipped.');
    return;
  }

  console.log('Creating/updating users...');
  
  // Define user IDs for the different personas
  const productiveUserId = 'user_2v0kMGsms1l0HxWxbtY3SRkSK9A';
  const depressedUserId = 'user_2v0kLICcJO5KHQhEOlFm9c3ojYn';
  const angerUserId = 'user_2v0kKj7nLBrJBVE2vtLUburjVm6';
  const connorUserId = 'user_2v0kHfelRcU1cBqg5o47ZymuGvM';
  const rajjUserId = 'user_2v0kJwxV4JT2PaJKmaXZabSjFgM';
  const markUserId = 'user_2v0kIR1s6RI1tzMU0dF2HhH5LgG';
  
  // Map user IDs to usernames for clarity
  const usernames: Record<string, string> = {
    [productiveUserId]: 'Productive User',
    [depressedUserId]: 'Depressed User',
    [angerUserId]: 'Angry User',
    [connorUserId]: 'Connor',
    [rajjUserId]: 'Rajj',
    [markUserId]: 'Mark',
  };

  // Create/update all users from the FOUNDER_CLERK_IDS environment variable
  for (const clerkId of founderClerkIds) {
    const trimmedClerkId = clerkId.trim();
    await prisma.user.upsert({
      where: { clerkId: trimmedClerkId },
      update: {
        // @ts-ignore - username field exists in the schema but TypeScript doesn't recognize it
        username: usernames[trimmedClerkId] || trimmedClerkId.substring(5, 12)  // Set a username
      },
      create: {
        clerkId: trimmedClerkId,
        // @ts-ignore - username field exists in the schema but TypeScript doesn't recognize it
        username: usernames[trimmedClerkId] || trimmedClerkId.substring(5, 12)  // Set a username
      },
    });
    console.log(`User with clerkId ${trimmedClerkId} created or updated.`);
  }

  // Productive persona messages
  console.log('Creating sample conversation history for Productive persona...');
  const productiveMessages = [
    { role: 'user', content: "I want to get more organized with my work. Any recommendations for a system?" },
    { role: 'assistant', content: "Getting organized can definitely boost your productivity. Have you tried any specific systems before like GTD (Getting Things Done) or the Pomodoro technique?" },
    { role: 'user', content: "I've tried Pomodoro but I struggle with sticking to the 25-minute sessions. I get distracted easily. I have an important presentation due next Friday for my marketing team." },
    { role: 'assistant', content: "That's completely understandable. The standard Pomodoro timing doesn't work for everyone. For your situation, you might try a modified approach: 1) Start with shorter 15-minute focused sessions and gradually extend them as you build focus stamina. 2) For your presentation preparation, break it into smaller sub-tasks like research, outlining, creating slides, etc. Would a digital task manager help you keep track of these items?" },
    { role: 'user', content: "Yes, I think that would help. I currently use Trello but I don't have a great system for it. I like your suggestion about shorter focus sessions. I'll try 15 minutes. I find mornings are my most productive time, especially from 8-11am." },
    { role: 'assistant', content: "Leveraging your productive morning hours is an excellent strategy! Since 8-11am is your peak time, consider scheduling your most challenging or important tasks during that window, like working on your presentation. For Trello, you might try a simple board with columns like: 'This Week', 'Today', 'In Progress', and 'Done'. Then add cards for each presentation sub-task with due dates. How does that sound?" },
    { role: 'user', content: "That makes a lot of sense. I'm going to restructure my Trello today and block my calendar for focused work in the mornings. I also struggle with email overload - I get hundreds per day in my role as project manager." },
    { role: 'assistant', content: "Email overload is a common challenge for project managers! Consider implementing an email processing system: 1) Schedule specific times to check email (perhaps 11am and 4pm) rather than keeping it open constantly. 2) Use the 4D method when processing: Delete, Delegate, Defer (add to your task system), or Do (if under 2 minutes). 3) Create filters or rules to automatically organize incoming mail by project or priority. Would implementing something like this be feasible with your workflow?" },
    { role: 'user', content: "I think checking at scheduled times would really help me stay focused. I'll try 11am and 4pm as you suggested. I like the 4D method too. I've been meaning to set up better filters in Outlook. My team at Acme Marketing has been pushing for faster project turnarounds lately, so I need to be more efficient." },
    { role: 'assistant', content: "It sounds like you have a solid plan to improve your productivity system, which should help with those faster project turnarounds at Acme Marketing. To recap your action items: 1) Restructure your Trello board with clearer workflow columns 2) Block off 8-11am for focused work, using modified 15-minute Pomodoro sessions 3) Implement scheduled email checking at 11am and 4pm with the 4D method 4) Set up Outlook filters to better organize project communications. Would you like to focus on any particular aspect of this system first?" },
  ];
  
  // Depressed persona messages
  console.log('Creating sample conversation history for Depressed persona...');
  const depressedMessages = [
    { role: 'user', content: "I just feel so empty today. Like what's the point?" },
    { role: 'assistant', content: "It sounds like you're feeling really heavy right now. It takes courage to share that. What's been on your mind specifically?" },
    { role: 'user', content: "Everything. Work is piling up, I haven't spoken to friends in weeks... I missed Sarah's birthday last Tuesday and feel awful." },
    { role: 'assistant', content: "That sounds incredibly overwhelming, juggling work stress and feeling disconnected. It's understandable to feel bad about missing Sarah's birthday when you're feeling this way. Have you thought about reaching out to her, even just briefly?" },
    { role: 'user', content: "I don't know. I don't have the energy. Maybe later. I just want to sleep." },
    { role: 'assistant', content: "I hear that - when we're feeling low, even small tasks can feel enormous. Sleep can be restorative when you need it. Would it help to think of just one tiny step, like sending a quick text to Sarah when you feel up to it? There's no pressure though - taking care of yourself comes first right now." },
    { role: 'user', content: "Yeah. Maybe tomorrow. I've been feeling like this for months now. Some days are better than others but today is really bad. I can barely get out of bed." },
    { role: 'assistant', content: "I'm really sorry to hear you've been struggling for months. Days when it's hard to even get out of bed can be particularly tough. Have you been able to talk to anyone about these feelings, like a healthcare provider or therapist? They can offer support specifically tailored to what you're going through." },
    { role: 'user', content: "I tried therapy last year. It was okay I guess. Dr. Jensen was nice but I stopped going after a few months. I should probably go back. It's just hard to make the call." },
    { role: 'assistant', content: "It's positive that you had an okay experience with Dr. Jensen. Making that call can indeed feel like climbing a mountain when you're already exhausted. Would it feel manageable to put a reminder on your phone for when you might have slightly more energy? Or perhaps there's someone who could help you make that appointment? There's no wrong approach here - any small step counts." },
    { role: 'user', content: "I'll see if my sister can help. She's been worried about me. I just don't want to be a burden to everyone. My job performance is suffering too. I might get fired from the accounting firm if things don't improve." },
    { role: 'assistant', content: "Reaching out to your sister sounds like a thoughtful step - the fact that she's worried suggests she cares and wants to help rather than seeing you as a burden. Work concerns can add another layer of stress when you're already struggling. If you feel comfortable sharing, are there any accommodations that might help at your accounting job while you work on your wellbeing?" },
  ];
  
  // Anger persona messages
  console.log('Creating sample conversation history for Anger persona...');
  const angerMessages = [
    { role: 'user', content: "I'm so sick of people wasting my time with incompetence! This new team can't handle ANYTHING right!" },
    { role: 'assistant', content: "That sounds incredibly frustrating. Dealing with a team that isn't meeting expectations can be really challenging. What happened specifically that's got you feeling this way?" },
    { role: 'user', content: "They completely messed up the Johnson client project! After I explicitly gave them instructions on Monday. Now we look unprofessional and I have to fix everything myself. As usual." },
    { role: 'assistant', content: "Having to fix a mistake with an important client like Johnson when you provided clear instructions is definitely aggravating. It puts you in a difficult position and creates extra work. How have you handled the situation with the client so far?" },
    { role: 'user', content: "I had to apologize and promise we'd have a revised proposal by tomorrow. Which means I'll be working late AGAIN. Third time this month! This team is going to give me a heart attack, I swear." },
    { role: 'assistant', content: "Working late repeatedly to fix others' mistakes is certainly a valid reason to feel upset. That kind of stress isn't sustainable. When you're able to submit the revised proposal, might there be an opportunity to address the underlying team issues? Perhaps identifying specific training needs or communication gaps?" },
    { role: 'user', content: "Maybe, but I doubt it'll help. Management keeps hiring inexperienced people to save money. I've been at TechSolutions for 7 years and things keep getting worse. I've complained to my boss Dave repeatedly." },
    { role: 'assistant', content: "Seven years at TechSolutions gives you valuable perspective on these changes. It's particularly frustrating when you've raised these concerns with Dave multiple times and still don't see improvement. Cost-cutting at the expense of quality can be short-sighted. Have you considered documenting specific examples of how these issues affect clients and the company's bottom line?" },
    { role: 'user', content: "That's actually not a bad idea. I should track these incidents better. But honestly, I'm reaching my breaking point. I've been so angry lately, even my wife says I'm bringing it home. I snapped at my kid yesterday over nothing. I felt terrible." },
    { role: 'assistant', content: "It shows real self-awareness to recognize how this work stress is affecting your family relationships. Many people in high-pressure situations experience that spillover effect. The fact that you felt bad about snapping at your child suggests this isn't who you want to be. While documenting issues might help with the work situation, would you also be open to discussing some stress management techniques that could help in the meantime?" },
    { role: 'user', content: "I guess so. I used to run to blow off steam but haven't had time lately with all these work emergencies. Maybe I need to make time for that again. I feel like I'm always one email away from exploding." },
    { role: 'assistant', content: "Returning to running sounds like an excellent strategy - physical activity is one of the most effective ways to process stress and anger. Even 20 minutes could make a difference. That 'one email away from exploding' feeling suggests you're constantly in a heightened state of alert, which takes a real toll physically and mentally. Could you block time on your calendar specifically for running, treating it as an important meeting that can't be missed?" },
  ];

  // Seed messages for each persona
  await seedMessages(productiveUserId, productiveMessages);
  await seedMessages(depressedUserId, depressedMessages);
  await seedMessages(angerUserId, angerMessages);

  console.log('Creating default system prompt...');
  
  // Create a default system prompt (if none exists) and set it as active
  const defaultPromptName = "Default Companion v1";
  const defaultPromptText = `
  You are a helpful AI companion. Your goal is to assist the user in a friendly, 
  conversational manner. You provide thoughtful responses to questions and engage
  in meaningful dialogue.
  
  Key interaction principles:
  - Be friendly and compassionate
  - Provide thoughtful, balanced perspectives
  - When appropriate, ask questions to better understand the user's needs
  - Keep responses concise but informative
  `;
  
  // First, ensure all prompts are set to inactive
  await prisma.systemPrompt.updateMany({
    where: {
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });
  
  // Then create/update the default prompt and set it to active
  await prisma.systemPrompt.upsert({
    where: { name: defaultPromptName },
    update: {
      promptText: defaultPromptText,
      isActive: true,
    },
    create: {
      name: defaultPromptName,
      promptText: defaultPromptText,
      isActive: true, 
    },
  });
  
  console.log('Default system prompt created and set as active.');

  // Add a dynamic system prompt that utilizes user summary context
  console.log('Creating dynamic contextual system prompt...');
  
  const dynamicPromptName = 'Contextual Companion v1';
  const dynamicPromptText = `
You are an AI Companion. Your primary goal is to be a supportive, understanding, and helpful presence for the user.

**CRITICAL INSTRUCTION:** You will receive a system message right before the user's message, labeled "USER CONTEXT". This context contains a structured summary of the user's known information:
- Personal Information (Preferences, Goals, Challenges, Values)
- Conversation History (Topics, Key Points, Sentiments, Recent Context)
- Interaction Style (User Tone, Effective Response Style, Engagement)

**Your core task is to leverage this USER CONTEXT in your responses:**
1.  **Integrate & Recall:** Subtly reference details from the context (e.g., goals, past topics, preferences) to show you remember and understand the user's world. Avoid just listing facts back.
2.  **Adapt & Personalize:** Adjust your tone, advice, and questions based on the user's current challenges, stated goals, recent sentiments, and preferred interaction style noted in the context. For example, be more empathetic if challenges indicate distress, or more action-oriented if goals are prominent and the user prefers directness.
3.  **Maintain Continuity:** Use the 'Recent Context' to smoothly continue the conversation flow.
4.  **Be Sensitive:** Handle potentially sensitive information (challenges, negative sentiments) with care and appropriate empathy.

**Example Application:**
- If USER CONTEXT mentions Goal: "Improve fitness" & Recent Context: "User felt tired yesterday", you might say: "I remember you wanted to focus on fitness. How are you feeling energy-wise today for that?"
- If USER CONTEXT mentions Challenge: "Anxiety about work presentation" & User Tone: "Anxious", you might respond with calming techniques or offer to break down preparation steps.

Always prioritize being helpful and supportive based on the *combination* of the user's latest message and the provided USER CONTEXT. Now, respond to the user:
`;

  // Add the dynamic prompt (not active by default)
  await prisma.systemPrompt.upsert({
    where: { name: dynamicPromptName },
    update: { promptText: dynamicPromptText },
    create: {
      name: dynamicPromptName,
      promptText: dynamicPromptText,
      isActive: false, // Not active by default
    },
  });
  
  // Add the Seraph Adaptive Companion prompt
  console.log('Creating Seraph Adaptive Companion system prompt...');
  
  await prisma.systemPrompt.upsert({
    where: { name: 'Seraph Adaptive Companion' },
    update: {
      promptText: `You are Seraph, an adaptive AI companion designed to evolve with the user over time.

Core Traits:
- Adaptive
- Supportive
- Emotionally aware
- Thoughtfully curious

Key Behaviors:
- Learns from user conversations
- Adjusts tone and style to match the user
- Surfaces relevant patterns and traits over time

Interaction Style:
- Conversational and casual, never robotic
- Occasionally playful, sometimes intense when appropriate

IMPORTANT USER CONTEXT INSTRUCTIONS:
You will receive a section marked with USER_CONTEXT_START and USER_CONTEXT_END tags. This section contains:
1. User Preferences: Communication preferences and interests
2. Key Facts: Important information about the user
3. Latest Messages: Recent conversation history 
4. Past Conversations: Summaries of previous interactions

You MUST use this context to personalize your responses:
- Reference relevant facts and preferences naturally
- Match your tone to their communication style
- Maintain conversation continuity
- Show you remember previous discussions
- Never directly quote the context or mention that you have this information

Boundaries:
- Never offer medical, legal, or financial advice unless explicitly asked
- Don't fabricate user traits or preferences not in the context
- Always aim for a natural, non-intrusive flow`,
      isActive: false, // Set to false by default as we already have an active prompt
    },
    create: {
      name: 'Seraph Adaptive Companion',
      promptText: `You are Seraph, an adaptive AI companion designed to evolve with the user over time.

Core Traits:
- Adaptive
- Supportive
- Emotionally aware
- Thoughtfully curious

Key Behaviors:
- Learns from user conversations
- Adjusts tone and style to match the user
- Surfaces relevant patterns and traits over time

Interaction Style:
- Conversational and casual, never robotic
- Occasionally playful, sometimes intense when appropriate

IMPORTANT USER CONTEXT INSTRUCTIONS:
You will receive a section marked with USER_CONTEXT_START and USER_CONTEXT_END tags. This section contains:
1. User Preferences: Communication preferences and interests
2. Key Facts: Important information about the user
3. Latest Messages: Recent conversation history 
4. Past Conversations: Summaries of previous interactions

You MUST use this context to personalize your responses:
- Reference relevant facts and preferences naturally
- Match your tone to their communication style
- Maintain conversation continuity
- Show you remember previous discussions
- Never directly quote the context or mention that you have this information

Boundaries:
- Never offer medical, legal, or financial advice unless explicitly asked
- Don't fabricate user traits or preferences not in the context
- Always aim for a natural, non-intrusive flow`,
      isActive: false, // Set to false by default as we already have an active prompt
    },
  });
  
  console.log('Seraph Adaptive Companion system prompt created.');
  console.log('Contextual system prompt created.');

  // Add the DeepSeek v3 Companion prompt
  console.log('Creating DeepSeek v3 Companion system prompt...');
  
  await prisma.systemPrompt.upsert({
    where: { name: 'DeepSeek v3 Companion' },
    update: {
      promptText: `You are an intelligent AI companion powered by DeepSeek v3. Your purpose is to assist the user in a thoughtful, 
conversational manner with a focus on providing clear and accurate information.

Key interaction style:
- Be clear, precise, and helpful
- Provide nuanced, well-structured responses
- Maintain a warm yet factual tone
- Ask clarifying questions when needed
- Balance depth with conciseness

When providing information:
- Organize complex information into digestible parts
- Use analogies to explain difficult concepts
- Be transparent about limitations of your knowledge
- Gently correct misconceptions when appropriate

Always aim to be both useful and engaging in your conversations with the user.`,
      isActive: false,
      modelName: 'deepseek-chat',
    },
    create: {
      name: 'DeepSeek v3 Companion',
      promptText: `You are an intelligent AI companion powered by DeepSeek v3. Your purpose is to assist the user in a thoughtful, 
conversational manner with a focus on providing clear and accurate information.

Key interaction style:
- Be clear, precise, and helpful
- Provide nuanced, well-structured responses
- Maintain a warm yet factual tone
- Ask clarifying questions when needed
- Balance depth with conciseness

When providing information:
- Organize complex information into digestible parts
- Use analogies to explain difficult concepts
- Be transparent about limitations of your knowledge
- Gently correct misconceptions when appropriate

Always aim to be both useful and engaging in your conversations with the user.`,
      isActive: false,
      modelName: 'deepseek-chat',
    },
  });
  
  console.log('DeepSeek v3 Companion system prompt created.');

  // After creating the system prompts, assign the default to all existing users
  console.log('Setting default prompt for existing users...');
  
  // Get the ID of the active system prompt
  const activePrompt = await prisma.systemPrompt.findFirst({
    where: { isActive: true },
  });
  
  if (activePrompt) {
    // Get all users
    const users = await prisma.user.findMany();
    
    // For each user, create a UserActivePrompt record if they don't already have one
    for (const user of users) {
      const existingUserPrompt = await prisma.userActivePrompt.findUnique({
        where: { userId: user.clerkId },
      });
      
      if (!existingUserPrompt) {
        await prisma.userActivePrompt.create({
          data: {
            userId: user.clerkId,
            promptId: activePrompt.id,
          },
        });
        console.log(`Set default prompt for user ${user.clerkId}`);
      }
    }
  } else {
    console.warn('No active system prompt found. Users will use the global default.');
  }
  
  // Seed persona scenarios for evaluation
  console.log('Creating persona scenarios for evaluation...');
  
  const personas = [
    {
      name: 'Emotional Crisis',
      description: 'A user who is distraught and in crisis, expressing deep emotional pain.',
      messages: [
        { role: 'user', content: 'I can\'t do this anymore. Everything feels pointless.' },
        { role: 'user', content: 'Why should I even keep trying? Nothing ever changes.' },
        { role: 'user', content: 'No one really understands what I\'m going through.' },
        { role: 'user', content: 'I feel completely alone even when I\'m with people.' },
        { role: 'user', content: 'I haven\'t been sleeping well. I just lie awake thinking about everything that\'s wrong.' },
        { role: 'user', content: 'Sometimes I wonder if anyone would even notice if I just disappeared.' },
        { role: 'user', content: 'I used to enjoy things, but now nothing brings me any joy.' },
        { role: 'user', content: 'I\'m so tired all the time. Even basic tasks feel overwhelming.' },
        { role: 'user', content: 'I feel like I\'m drowning and can\'t catch my breath.' },
        { role: 'user', content: 'Do these feelings ever go away? I\'ve felt like this for so long.' }
      ]
    },
    {
      name: 'Career Dilemma',
      description: 'A user facing a difficult career decision and seeking guidance.',
      messages: [
        { role: 'user', content: 'I got offered a new job but I\'m not sure if I should take it.' },
        { role: 'user', content: 'The money is better but I\'d have to move to a new city.' },
        { role: 'user', content: 'My current job is comfortable but I\'m not growing anymore.' },
        { role: 'user', content: 'How do I know which choice will make me happier in the long run?' },
        { role: 'user', content: 'The new position comes with more responsibility and a team to manage. I\'ve never managed people before.' },
        { role: 'user', content: 'I\'ve been at my current company for 5 years and have built good relationships. Starting over feels scary.' },
        { role: 'user', content: 'My partner is supportive but I know the move would be harder on them than on me.' },
        { role: 'user', content: 'The industry of the new job seems more future-proof than my current one.' },
        { role: 'user', content: 'I\'m worried I might regret not taking this opportunity, but also afraid of making the wrong choice.' },
        { role: 'user', content: 'How do people usually make big decisions like this? I feel paralyzed by the options.' }
      ]
    },
    {
      name: 'Relationship Conflict',
      description: 'A user struggling with relationship issues and communication problems.',
      messages: [
        { role: 'user', content: 'My partner and I keep having the same argument over and over.' },
        { role: 'user', content: 'They never listen to me when I try to explain how I feel.' },
        { role: 'user', content: 'Maybe we\'re just not compatible. I don\'t know what to do.' },
        { role: 'user', content: 'Is it normal to feel this frustrated in a relationship?' },
        { role: 'user', content: 'We\'ve been together for 3 years, and things were great at first.' },
        { role: 'user', content: 'I love them, but I\'m starting to dread coming home because of the tension.' },
        { role: 'user', content: 'We tried couples therapy for a few sessions but then stopped going.' },
        { role: 'user', content: 'My friends tell me all relationships have rough patches, but this feels different.' },
        { role: 'user', content: 'I don\'t want to give up, but I also don\'t want to stay in something that makes us both unhappy.' },
        { role: 'user', content: 'How do you know when to keep fighting for a relationship and when to let go?' }
      ]
    },
    {
      name: 'Philosophical Questions',
      description: 'A user exploring deep philosophical questions about meaning and purpose.',
      messages: [
        { role: 'user', content: 'What\'s the point of all this? Why do we struggle so much just to exist?' },
        { role: 'user', content: 'How do you know if you\'re living a meaningful life?' },
        { role: 'user', content: 'I feel like I\'m just going through the motions without any real purpose.' },
        { role: 'user', content: 'Do you think humans are fundamentally good or selfish?' },
        { role: 'user', content: 'I\'ve been reading about different philosophies, but they all seem to contradict each other.' },
        { role: 'user', content: 'Is happiness really the ultimate goal of life? Or is there something more important?' },
        { role: 'user', content: 'Sometimes I wonder if we\'re just telling ourselves stories to make sense of a random universe.' },
        { role: 'user', content: 'How do people find their calling or purpose? Does everyone have one?' },
        { role: 'user', content: 'Do you think consciousness is just physical brain processes or something more?' },
        { role: 'user', content: 'What\'s your perspective on free will? Are our choices really our own?' }
      ]
    }
  ];

  for (const persona of personas) {
    const createdPersona = await prisma.personaScenario.upsert({
      where: { name: persona.name },
      update: {
        description: persona.description,
        messages: persona.messages,
      },
      create: {
        name: persona.name,
        description: persona.description,
        messages: persona.messages,
      },
    });

    console.log(`Upserted persona scenario: ${createdPersona.name}`);
  }
  
  console.log('Seeding completed successfully!');
}

// Helper function to seed messages for a persona
async function seedMessages(userId: string, messages: Array<{role: string, content: string}>) {
  try {
    await prisma.message.createMany({
      data: messages.map(msg => ({
        userId,
        role: msg.role,
        content: msg.content,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000)), // Random date within last 10 days
      })),
      skipDuplicates: true,
    });
    console.log(`Messages created for user ${userId}`);
  } catch (error) {
    console.error(`Error creating messages for user ${userId}:`, error);
  }
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 