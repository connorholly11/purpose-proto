import ChatInterface from './components/ChatInterface';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-gray-800 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">AI Voice Companion</h1>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto p-4">
        <ChatInterface />
      </main>
      
      <footer className="bg-gray-100 p-4 text-center text-gray-600 text-sm">
        <p>AI Voice Companion - Powered by OpenAI GPT-4o</p>
      </footer>
    </div>
  );
}
