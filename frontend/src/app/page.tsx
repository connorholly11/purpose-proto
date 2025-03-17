import Layout from '@/components/Layout';
import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  return (
    <Layout>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">AI Companion Chat</h1>
          <p className="text-gray-600 mt-2">
            Chat with an AI assistant that can help answer your questions and provide information.
          </p>
        </div>
        <div className="flex-1">
          <ChatInterface />
        </div>
      </div>
    </Layout>
  );
}
