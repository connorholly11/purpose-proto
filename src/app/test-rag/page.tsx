'use client';

import { useState } from 'react';
import { FaSearch, FaSpinner } from 'react-icons/fa';

export default function TestRagPage() {
  const [query, setQuery] = useState<string>('');
  const [responseData, setResponseData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'rag' | 'completion' | 'end2end'>('rag');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResponseData(null);

    try {
      if (selectedTab === 'rag') {
        // 1) RAG Only
        const ragRes = await fetch('/api/rag-service', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, topK: 5 })
        });
        if (!ragRes.ok) throw new Error(`RAG API error: ${ragRes.status}`);
        const ragData = await ragRes.json();
        setResponseData(ragData);

      } else if (selectedTab === 'completion') {
        // 2) Completion Only
        const compRes = await fetch('/api/completion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: query }],
            context: 'Test context for completion.'
          }),
        });
        if (!compRes.ok) throw new Error(`Completion API error: ${compRes.status}`);
        const compData = await compRes.json();
        setResponseData(compData);

      } else if (selectedTab === 'end2end') {
        // 3) End-to-End: first RAG, then pass to completion
        const ragRes = await fetch('/api/rag-service', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, topK: 5 })
        });
        if (!ragRes.ok) throw new Error(`RAG API error: ${ragRes.status}`);
        const ragData = await ragRes.json();

        const compRes = await fetch('/api/completion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: query }],
            context: ragData.context
          }),
        });
        if (!compRes.ok) throw new Error(`Completion API error: ${compRes.status}`);
        const compData = await compRes.json();
        setResponseData({
          rag: ragData,
          completion: compData
        });
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test RAG System</h1>

      {/* Tabs */}
      <div className="mb-6 border-b">
        <div className="flex">
          <button
            className={`py-2 px-4 ${selectedTab === 'rag' ? 'border-b-2 border-indigo-500 font-medium text-indigo-600' : 'text-gray-500'}`}
            onClick={() => setSelectedTab('rag')}
          >
            Test RAG Only
          </button>
          <button
            className={`py-2 px-4 ${selectedTab === 'completion' ? 'border-b-2 border-indigo-500 font-medium text-indigo-600' : 'text-gray-500'}`}
            onClick={() => setSelectedTab('completion')}
          >
            Test Completion Only
          </button>
          <button
            className={`py-2 px-4 ${selectedTab === 'end2end' ? 'border-b-2 border-indigo-500 font-medium text-indigo-600' : 'text-gray-500'}`}
            onClick={() => setSelectedTab('end2end')}
          >
            Test End-to-End
          </button>
        </div>
      </div>

      {/* Query Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-1">Test Query</label>
          <div className="flex">
            <input
              id="query"
              type="text"
              className="flex-1 px-4 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter a query to test the RAG system"
              disabled={loading}
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700 flex items-center"
              disabled={loading || !query.trim()}
            >
              {loading ? <FaSpinner className="animate-spin mr-2" /> : <FaSearch className="mr-2" />}
              Test
            </button>
          </div>
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Results Display */}
      {responseData && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Results</h2>
          {selectedTab === 'rag' && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-100 rounded-md">
                <h3 className="font-medium mb-2">Operation Time:</h3>
                <p>{responseData.operationTime}ms</p>
              </div>
              <div className="p-4 bg-gray-100 rounded-md">
                <h3 className="font-medium mb-2">Context Retrieved:</h3>
                <pre className="whitespace-pre-wrap bg-white p-3 rounded border max-h-60 overflow-y-auto">
                  {responseData.context || 'No context retrieved'}
                </pre>
              </div>
              <div className="p-4 bg-gray-100 rounded-md">
                <h3 className="font-medium mb-2">Matches ({responseData.matches?.length || 0}):</h3>
                <div className="space-y-2">
                  {responseData.matches && responseData.matches.length > 0 ? (
                    responseData.matches.map((match: any, index: number) => (
                      <div key={index} className="p-3 bg-white rounded border">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">Score: {match.score.toFixed(4)}</span>
                          {match.source && <span className="text-gray-500">Source: {match.source}</span>}
                        </div>
                        <p className="text-sm">{match.text}</p>
                      </div>
                    ))
                  ) : (
                    <p>No matches found</p>
                  )}
                </div>
              </div>
            </div>
          )}
          {selectedTab === 'completion' && (
            <div className="p-4 bg-gray-100 rounded-md">
              <h3 className="font-medium mb-2">AI Response:</h3>
              <div className="p-3 bg-white rounded border">
                {responseData.answer || 'No response received'}
              </div>
            </div>
          )}
          {selectedTab === 'end2end' && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-100 rounded-md">
                <h3 className="font-medium mb-2">RAG Context:</h3>
                <pre className="whitespace-pre-wrap bg-white p-3 rounded border max-h-40 overflow-y-auto">
                  {responseData.rag?.context || 'No context retrieved'}
                </pre>
              </div>
              <div className="p-4 bg-gray-100 rounded-md">
                <h3 className="font-medium mb-2">AI Response:</h3>
                <div className="p-3 bg-white rounded border">
                  {responseData.completion?.answer || 'No response received'}
                </div>
              </div>
              <div className="p-4 bg-gray-100 rounded-md">
                <h3 className="font-medium mb-2">RAG Matches ({responseData.rag?.matches?.length || 0}):</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {responseData.rag?.matches && responseData.rag.matches.length > 0 ? (
                    responseData.rag.matches.map((match: any, index: number) => (
                      <div key={index} className="p-3 bg-white rounded border">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">Score: {match.score.toFixed(4)}</span>
                          {match.source && <span className="text-gray-500">Source: {match.source}</span>}
                        </div>
                        <p className="text-sm">{match.text}</p>
                      </div>
                    ))
                  ) : (
                    <p>No matches found</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Raw Data for debugging */}
          <div className="mt-6">
            <details>
              <summary className="cursor-pointer text-gray-600 hover:text-gray-800">Raw Response Data</summary>
              <pre className="mt-2 p-4 bg-gray-800 text-green-400 rounded-md overflow-x-auto text-xs">
                {JSON.stringify(responseData, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}
