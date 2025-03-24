'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/app/contexts/UserContext';
import { RAGAnalytics, RAGOperationData, RetrievedDocumentData } from '@/types';

export default function RagAnalytics() {
  const { currentUser } = useUser();
  const [analytics, setAnalytics] = useState<RAGAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<RAGOperationData | null>(null);
  const [showOperationDetails, setShowOperationDetails] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to fetch RAG analytics data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get user filter from current user
      const userFilter = currentUser?.id || '';
      
      // Call the API to get RAG analytics data
      let url = '/api/rag';
      if (userFilter) {
        url += `?userId=${encodeURIComponent(userFilter)}`;
      }
      
      console.log('Fetching RAG analytics from:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('RAG analytics data:', data);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading analytics data');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  // Initial data load and when user changes
  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

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

  if (loading && !analytics) {
    return (
      <div className="flex justify-center items-center p-8 min-h-[300px]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-blue)]"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-300">Loading RAG analytics data...</p>
        </div>
      </div>
    );
  }
  
  if (error && !analytics) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl p-8 text-center">
        <h3 className="text-red-600 dark:text-red-400 text-lg font-medium mb-2">Error Loading Analytics</h3>
        <p className="text-red-500 dark:text-red-300">{error}</p>
        <button 
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-800/30 text-red-600 dark:text-red-300 rounded-full hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Cards */}
      {analytics ? (
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/50 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">RAG Performance</h2>
            <button 
              onClick={handleRefresh}
              className="text-[var(--primary-blue)] hover:text-[var(--primary-blue-dark)] transition-colors text-sm px-3 py-1.5 rounded-full bg-blue-50/80 dark:bg-blue-900/30 hover:bg-blue-100/80 dark:hover:bg-blue-900/50"
            >
              Refresh Data
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50/80 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-100/80 dark:border-blue-800/30">
              <div className="text-blue-500 dark:text-blue-400 text-sm font-medium mb-1">Total Queries</div>
              <div className="text-3xl font-bold text-slate-800 dark:text-slate-200">{analytics.totalOperations || 0}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {currentUser ? `For ${currentUser.name}'s account` : 'Across all users'}
              </div>
            </div>
            
            <div className="bg-emerald-50/80 dark:bg-emerald-900/20 p-5 rounded-xl border border-emerald-100/80 dark:border-emerald-800/30">
              <div className="text-emerald-500 dark:text-emerald-400 text-sm font-medium mb-1">Success Rate</div>
              <div className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                {analytics.successRate ? `${(analytics.successRate * 100).toFixed(1)}%` : 'N/A'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Based on {analytics.totalOperations || 0} operations
              </div>
            </div>
            
            <div className="bg-violet-50/80 dark:bg-violet-900/20 p-5 rounded-xl border border-violet-100/80 dark:border-violet-800/30">
              <div className="text-violet-500 dark:text-violet-400 text-sm font-medium mb-1">Avg Response Time</div>
              <div className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                {analytics.avgResponseTime ? `${analytics.avgResponseTime.toFixed(0)}ms` : 'N/A'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                From query to response
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Usage By Input Source */}
      {analytics && analytics.operationsBySource ? (
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/50 mb-8">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">RAG Usage by Source</h2>
          <div className="space-y-4">
            {Object.entries(analytics.operationsBySource).map(([source, count], index) => (
              <div key={source} className="flex items-center">
                <div className="w-28 text-sm text-slate-600 dark:text-slate-300 font-medium">{source}</div>
                <div className="flex-1 mx-2">
                  <div className="h-8 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-500 dark:from-blue-500 dark:to-blue-600"
                      style={{ 
                        width: `${Math.min(100, (Number(count) / analytics.totalOperations) * 100)}%`,
                        transition: 'width 1s ease-in-out' 
                      }}
                    ></div>
                  </div>
                </div>
                <div className="w-16 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {count} 
                  <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">
                    ({((Number(count) / analytics.totalOperations) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Recent Operations */}
      {analytics && analytics.recentOperations && analytics.recentOperations.length > 0 ? (
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/50">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">Recent RAG Operations</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                  <th className="pb-3 text-sm font-medium text-slate-500 dark:text-slate-400">Time</th>
                  <th className="pb-3 text-sm font-medium text-slate-500 dark:text-slate-400">Source</th>
                  <th className="pb-3 text-sm font-medium text-slate-500 dark:text-slate-400">Query</th>
                  <th className="pb-3 text-sm font-medium text-slate-500 dark:text-slate-400">Matches</th>
                  <th className="pb-3 text-sm font-medium text-slate-500 dark:text-slate-400">Duration</th>
                  <th className="pb-3 text-sm font-medium text-slate-500 dark:text-slate-400"></th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentOperations.map((op) => (
                  <tr key={op.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                    <td className="py-3 text-sm text-slate-600 dark:text-slate-300">
                      {new Date(op.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 text-sm text-slate-600 dark:text-slate-300">{op.source}</td>
                    <td className="py-3 text-sm text-slate-700 dark:text-slate-200 font-medium">
                      {op.query.length > 50 ? op.query.substring(0, 50) + '...' : op.query}
                    </td>
                    <td className="py-3 text-sm text-slate-600 dark:text-slate-300">{op.retrievedDocs?.length || 0}</td>
                    <td className="py-3 text-sm text-slate-600 dark:text-slate-300">{op.operationTime}ms</td>
                    <td className="py-3 text-sm">
                      <button
                        onClick={() => handleViewOperationDetails(op.id)}
                        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : analytics ? (
        <div className="text-center p-8 bg-slate-50/80 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-700/20">
          <p className="text-slate-500 dark:text-slate-400">No RAG operations found for this user.</p>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Try using the chat interface or knowledge base to generate RAG operations.
          </p>
        </div>
      ) : null}

      {/* Operation details modal */}
      {showOperationDetails && selectedOperation && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg w-full max-w-3xl max-h-[80vh] overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Operation Details</h3>
              <button 
                onClick={() => setShowOperationDetails(false)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Query</div>
                  <div className="text-base text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                    {selectedOperation.query}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Operation Info</div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500 dark:text-slate-400">Source:</span>
                      <span className="text-slate-800 dark:text-slate-200">{selectedOperation.source}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500 dark:text-slate-400">Duration:</span>
                      <span className="text-slate-800 dark:text-slate-200">{selectedOperation.operationTime}ms</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500 dark:text-slate-400">Match Count:</span>
                      <span className="text-slate-800 dark:text-slate-200">{selectedOperation.retrievedDocs?.length || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Time:</span>
                      <span className="text-slate-800 dark:text-slate-200">
                        {new Date(selectedOperation.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-base font-medium text-slate-700 dark:text-slate-300 mb-2">Retrieved Documents</div>
                {selectedOperation.retrievedDocs && selectedOperation.retrievedDocs.length > 0 ? (
                  <div className="space-y-4">
                    {selectedOperation.retrievedDocs.map((doc, index) => (
                      <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                        <div className="bg-slate-50 dark:bg-slate-700/50 px-4 py-2 flex justify-between items-center">
                          <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {doc.source || 'Unknown Source'}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Match Score: {doc.similarityScore.toFixed(4)}
                          </div>
                        </div>
                        
                        <div className="p-4 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                          {doc.content}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                    <p className="text-slate-500 dark:text-slate-400">No documents retrieved</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 