'use client';

import { useState } from 'react';
import browserLogger from '@/lib/utils/browser-logger';

export default function TestRagPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [operations, setOperations] = useState<any[]>([]);

  const handleCreateConversation = async () => {
    try {
      browserLogger.info('TestRag', 'Creating test conversation');
      
      const response = await fetch('/api/conversations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create conversation: ${response.status}`);
      }
      
      const conversation = await response.json();
      setConversationId(conversation.id);
      browserLogger.info('TestRag', 'Conversation created', { conversationId: conversation.id });
      console.log('Created conversation:', conversation.id);
    } catch (error) {
      browserLogger.error('TestRag', 'Error creating conversation', { error: (error as Error).message });
      console.error('Error creating conversation:', error);
    }
  };

  const handleRagQuery = async () => {
    if (!query.trim()) return;
    if (!conversationId) {
      alert('Please create a conversation first');
      return;
    }

    setLoading(true);
    browserLogger.info('TestRag', 'Executing RAG query', { 
      query: query.length > 50 ? query.substring(0, 50) + '...' : query,
      conversationId
    });
    
    try {
      const response = await fetch('/api/rag-service', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          topK: 5,
          source: 'test-page',
          conversationId
        }),
      });
      
      if (!response.ok) {
        browserLogger.error('TestRag', 'RAG processing failed', { status: response.status });
        throw new Error(`RAG processing failed: ${response.status}`);
      }
      
      const result = await response.json();
      browserLogger.info('TestRag', 'RAG query successful', { 
        operationTime: result.operationTime,
        matchCount: result.matches?.length || 0
      });
      
      setResult(result);
      console.log('RAG result:', result);
    } catch (error) {
      browserLogger.error('TestRag', 'Error querying RAG', { error: (error as Error).message });
      console.error('Error querying RAG:', error);
      setResult({ error: 'Error querying RAG' });
    } finally {
      setLoading(false);
    }
  };

  const checkRagOperations = async () => {
    if (!conversationId) {
      alert('Please create a conversation first');
      return;
    }

    browserLogger.info('TestRag', 'Checking RAG operations', { conversationId });
    try {
      const response = await fetch(`/api/rag-operations?conversationId=${conversationId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch RAG operations: ${response.status}`);
      }
      
      const ragOps = await response.json();
      
      browserLogger.info('TestRag', 'RAG operations fetched', { 
        operationCount: ragOps.length
      });
      
      setOperations(ragOps);
      console.log('RAG Operations:', ragOps);
    } catch (error) {
      browserLogger.error('TestRag', 'Error fetching RAG operations', { 
        error: (error as Error).message
      });
      console.error('Error fetching RAG operations:', error);
      alert('Error fetching RAG operations, check console for details.');
    }
  };
  
  const handleDownloadLogs = () => {
    browserLogger.info('TestRag', 'Downloading logs');
    browserLogger.downloadLogs();
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test RAG Functionality</h1>
      
      <div className="flex flex-col space-y-4 mb-6">
        <button
          onClick={handleCreateConversation}
          disabled={!!conversationId}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
        >
          {conversationId ? `Using conversation: ${conversationId}` : 'Create Test Conversation'}
        </button>
        
        <div className="flex space-x-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your query"
            className="flex-1 p-2 border rounded"
            disabled={!conversationId}
          />
          <button
            onClick={handleRagQuery}
            disabled={loading || !query.trim() || !conversationId}
            className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
          >
            {loading ? 'Processing...' : 'Test RAG Query'}
          </button>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={checkRagOperations}
            disabled={!conversationId}
            className="bg-purple-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
          >
            Check RAG Operations
          </button>
          
          <button
            onClick={handleDownloadLogs}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Download Logs
          </button>
        </div>
      </div>
      
      {operations.length > 0 && (
        <div className="border p-4 rounded mb-6">
          <h2 className="text-xl font-semibold mb-2">RAG Operations</h2>
          <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {operations.map((op) => (
              <div key={op.id} className="mb-4 p-3 bg-white rounded border">
                <div><strong>Query:</strong> {op.query}</div>
                <div><strong>Time:</strong> {op.timestamp.toLocaleString()}</div>
                <div><strong>Source:</strong> {op.source}</div>
                <div><strong>Operation Time:</strong> {op.operationTime}ms</div>
                <div><strong>Documents:</strong> {op.retrievedDocs.length}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {result && (
        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Result</h2>
          <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            <div className="mb-4">
              <strong>Operation Time:</strong> {result.operationTime}ms
            </div>
            <div className="mb-4">
              <strong>Matches:</strong> {result.matches?.length || 0}
            </div>
            {result.matches && result.matches.length > 0 && (
              <div>
                <strong>Top Match:</strong>
                <div className="mt-2 p-3 bg-white rounded border">
                  <div><strong>Score:</strong> {result.matches[0].score}</div>
                  <div><strong>Source:</strong> {result.matches[0].source || 'N/A'}</div>
                  <div className="mt-2 whitespace-pre-wrap">{result.matches[0].text}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 