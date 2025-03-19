'use client';

import ChatInterface from '@/components/ChatInterface';

export default function VoicePage() {
  return (
    <main className="h-screen bg-gray-100 pt-16">
      <div className="container mx-auto h-full flex flex-col">
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Voice Mode</h1>
          <p className="text-gray-600">
            In voice mode, you can speak to the AI companion and receive spoken responses.
            Click the microphone button to start recording your voice.
          </p>
        </div>
        <div className="flex-1">
          <ChatInterface initialVoiceMode={true} />
        </div>
      </div>
    </main>
  );
}
