import ChatInterface from './components/ChatInterface';

export default function Home() {
  return (
    <div className="container mx-auto p-4 flex flex-col h-[calc(100vh-80px)]">
      <ChatInterface />
    </div>
  );
}
