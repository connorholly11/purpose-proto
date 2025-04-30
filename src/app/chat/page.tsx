import React from 'react';
import { SignedIn } from '@clerk/nextjs';
import dynamic from 'next/dynamic';

// Dynamically import the ChatScreen component to prevent SSR issues with React Native Web components
const ChatScreen = dynamic(() => import('../../screens/ChatScreen'), { ssr: false });

export default function ChatPage() {
  return (
    <SignedIn>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <ChatScreen />
      </div>
    </SignedIn>
  );
}