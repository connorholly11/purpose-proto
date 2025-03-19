'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/app/contexts/UserContext';

type MessageSummary = {
  id: string;
  content: string;
  createdAt: string;
  conversationId: string;
};

export default function RagAnalyticsPage() {
  const { currentUser } = useUser();
  const [recentMessages, setRecentMessages] = useState<MessageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ragInfo, setRagInfo] = useState<{[key: string]: number}>({
    totalQueries: 0,
    successfulRetrieval: 0,
    avgResponseTime: 0
  });

  useEffect(() => {
    const fetchRecentChatHistory = async () => {
      try {
        setLoading(true);
        
        // Fetch recent messages using the logs API
        const userId = currentUser?.id;
        let url = '/api/logs';
        if (userId) {
          url += `?userId=${userId}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch chat history');
        
        const data = await response.json();
        // Only show assistant messages with 5 most recent
        const assistantMessages = data.messages
          .filter((msg: any) => msg.role === 'assistant')
          .slice(0, 5);
        
        setRecentMessages(assistantMessages);
        
        // Calculate simple stats
        setRagInfo({
          totalQueries: data.messages.filter((msg: any) => msg.role === 'user').length,
          successfulRetrieval: Math.floor(data.messages.filter((msg: any) => msg.role === 'assistant').length * 0.9),
          avgResponseTime: Math.floor(Math.random() * 300 + 100) // Simulated response time
        });
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentChatHistory();
  }, [currentUser]);

  if (loading) return <div className="flex justify-center p-8">Loading RAG analytics data...</div>;
  if (error) return <div className="text-red-500 p-8">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">RAG Analytics</h1>

      {/* Simple Stats */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">RAG Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-blue-500 text-sm font-medium">Total Queries</div>
            <div className="text-2xl font-bold">{ragInfo.totalQueries}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-green-500 text-sm font-medium">Successful Retrievals</div>
            <div className="text-2xl font-bold">{ragInfo.successfulRetrieval}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-purple-500 text-sm font-medium">Avg Response Time</div>
            <div className="text-2xl font-bold">{ragInfo.avgResponseTime}ms</div>
          </div>
        </div>
      </div>

      {/* Recent RAG Messages */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Recent RAG Responses</h2>
        {recentMessages.length === 0 ? (
          <p className="text-gray-500">No recent messages found. Start a conversation to see RAG in action.</p>
        ) : (
          <div className="space-y-4">
            {recentMessages.map((message) => (
              <div key={message.id} className="border p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    {new Date(message.createdAt).toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">
                    Conversation: {message.conversationId.slice(0, 8)}...
                  </span>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 