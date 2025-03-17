# AI Companion Frontend

This is the frontend for the AI Companion application. It provides a user interface for chatting with AI, viewing conversation logs, and rating AI responses.

## Features

- Chat interface with support for text input
- Voice input and output (placeholder UI)
- Dynamic system prompts (friendly vs. challenging)
- Multi-LLM support (OpenAI, Deepseek)
- Conversation logs with rating system

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env.local` file with the following variables:
   ```
   NEXT_PUBLIC_BACKEND_URL=http://localhost:3003
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Backend

This frontend connects to the AI Companion backend. Make sure the backend server is running on port 3003 before using the frontend.

## Technologies Used

- Next.js
- TypeScript
- Tailwind CSS
- Axios for API requests

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
