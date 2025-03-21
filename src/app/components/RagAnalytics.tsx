'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/app/contexts/UserContext';
import { RAGAnalytics, RAGOperationData, RetrievedDocumentData } from '@/types';

export default function RagAnalytics() {
  const { currentUser } = useUser();
  const [analytics, setAnalytics] = useState<RAGAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<RAGOperationData | null>(null);
  const [showOperationDetails, setShowOperationDetails] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get user filter from current user
        const userFilter = currentUser?.id || null;
        
        // Call the API to get RAG analytics data
        let url = '/api/rag';
        if (userFilter) {
          url += `?userId=${encodeURIComponent(userFilter)}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`);
        }
        
        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading analytics data');
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const handleViewOperationDetails = async (operationId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/rag?operationId=${operationId}`);
      if (!response.ok) {
        console.error(`Failed to fetch operation details: ${response.status} ${response.statusText}`);
        setError('Could not load operation details');
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      setSelectedOperation(data);
      setShowOperationDetails(true);
      setError(null);
    } catch (err) {
      console.error('Error fetching operation details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load operation details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8">Loading RAG analytics data...</div>;
  if (error) return <div className="text-red-500 p-8">Error: {error}</div>;

  return (
    <div>
      {/* Stats Cards */}
      {analytics && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">RAG Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-blue-500 text-sm font-medium">Total Queries</div>
              <div className="text-2xl font-bold">{analytics.totalOperations}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-green-500 text-sm font-medium">Success Rate</div>
              <div className="text-2xl font-bold">{(analytics.successRate * 100).toFixed(1)}%</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-purple-500 text-sm font-medium">Avg Response Time</div>
              <div className="text-2xl font-bold">{analytics.avgResponseTime.toFixed(0)}ms</div>
            </div>
          </div>
        </div>
      )}

      {/* Usage By Input Source */}
      {analytics && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">RAG Usage by Source</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="text-indigo-500 text-sm font-medium">Chat Interface</div>
              <div className="text-2xl font-bold">{analytics.operationsBySource.chat}</div>
            </div>
            <div className="bg-pink-50 p-4 rounded-lg">
              <div className="text-pink-500 text-sm font-medium">Real-time Voice</div>
              <div className="text-2xl font-bold">{analytics.operationsBySource.realtime_voice}</div>
            </div>
          </div>
        </div>
      )}

      {/* Most Frequently Retrieved Documents */}
      {analytics && analytics.topDocuments.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Most Frequently Retrieved Documents</h2>
          <div className="space-y-4">
            {analytics.topDocuments.map((doc) => (
              <div key={doc.documentId} className="border p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    Document ID: {doc.documentId.slice(0, 8)}...
                  </span>
                  <span className="text-sm bg-green-100 text-green-800 px-2 py-0.5 rounded">
                    Retrieved {doc.retrievalCount} times
                  </span>
                </div>
                <p className="text-gray-800 text-sm whitespace-pre-wrap">
                  {doc.content.length > 200 ? `${doc.content.slice(0, 200)}...` : doc.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent RAG Operations */}
      {analytics && analytics.recentOperations.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Recent RAG Operations</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Query</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response Time</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.recentOperations.map((operation) => (
                  <tr key={operation.id}>
                    <td className="py-2 px-4">{operation.query.length > 30 ? `${operation.query.slice(0, 30)}...` : operation.query}</td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${operation.source === 'chat' ? 'bg-indigo-100 text-indigo-800' : 'bg-pink-100 text-pink-800'}`}>
                        {operation.source === 'chat' ? 'Chat' : 'Voice'}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-sm text-gray-500">{new Date(operation.timestamp).toLocaleString()}</td>
                    <td className="py-2 px-4 text-sm">{operation.retrievedDocs.length}</td>
                    <td className="py-2 px-4 text-sm">{operation.operationTime}ms</td>
                    <td className="py-2 px-4">
                      <button 
                        onClick={() => handleViewOperationDetails(operation.id)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Operation Details Modal */}
      {showOperationDetails && selectedOperation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">RAG Operation Details</h3>
              <button 
                onClick={() => setShowOperationDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Query</h4>
              <p className="p-3 bg-gray-50 rounded">{selectedOperation.query}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <h4 className="font-semibold mb-2">Source</h4>
                <p className="p-3 bg-gray-50 rounded">{selectedOperation.source}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Time</h4>
                <p className="p-3 bg-gray-50 rounded">{new Date(selectedOperation.timestamp).toLocaleString()}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Response Time</h4>
                <p className="p-3 bg-gray-50 rounded">{selectedOperation.operationTime}ms</p>
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Retrieved Documents ({selectedOperation.retrievedDocs.length})</h4>
              <div className="space-y-4">
                {selectedOperation.retrievedDocs.map((doc, index) => (
                  <div key={doc.id} className="border p-4 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        Document {index + 1}
                      </span>
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-0.5 rounded">
                        Score: {doc.similarityScore.toFixed(4)}
                      </span>
                    </div>
                    <p className="text-gray-800 text-sm whitespace-pre-wrap">{doc.content}</p>
                    {doc.source && (
                      <div className="mt-2 text-xs text-gray-500">
                        Source: {doc.source}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 