'use client';

import { useState, useEffect } from 'react';
import { getLogs, rateResponse, LogEntry } from '@/services/api';

export default function LogsView() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'rated' | 'unrated' | 'positive' | 'negative'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRatingInProgress, setIsRatingInProgress] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    // Apply filters and search
    let result = [...logs];
    
    // Apply rating filter
    if (filter === 'rated') {
      result = result.filter(log => log.rating !== null);
    } else if (filter === 'unrated') {
      result = result.filter(log => log.rating === null);
    } else if (filter === 'positive') {
      result = result.filter(log => log.rating === true);
    } else if (filter === 'negative') {
      result = result.filter(log => log.rating === false);
    }
    
    // Apply search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(log => 
        log.userMessage.toLowerCase().includes(term) || 
        log.aiResponse.toLowerCase().includes(term)
      );
    }
    
    // Sort by timestamp (newest first)
    result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    setFilteredLogs(result);
  }, [logs, filter, searchTerm]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const logsData = await getLogs();
      setLogs(logsData);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError('Failed to fetch conversation logs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRate = async (id: string, rating: boolean) => {
    try {
      setIsRatingInProgress(id);
      await rateResponse({ id, rating });
      // Update local state to reflect the rating
      setLogs((prevLogs) =>
        prevLogs.map((log) =>
          log.id === id ? { ...log, rating } : log
        )
      );
    } catch (error) {
      console.error('Error rating response:', error);
      alert('Failed to rate the response');
    } finally {
      setIsRatingInProgress(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200 text-red-600 max-w-2xl mx-auto my-8">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium mb-2">{error}</h3>
        <button
          onClick={fetchLogs}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
        <h1 className="text-2xl font-bold mb-4">Conversation Logs</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Filter */}
          <div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="w-full p-2 border rounded bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Conversations</option>
              <option value="rated">Rated Only</option>
              <option value="unrated">Unrated Only</option>
              <option value="positive">Positive Ratings</option>
              <option value="negative">Negative Ratings</option>
            </select>
          </div>
          
          {/* Refresh button */}
          <button
            onClick={fetchLogs}
            className="p-2 bg-gray-100 rounded border hover:bg-gray-200 transition-colors"
            title="Refresh logs"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        
        <div className="text-sm text-gray-500">
          {filteredLogs.length} {filteredLogs.length === 1 ? 'conversation' : 'conversations'} found
        </div>
      </div>
      
      {filteredLogs.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {logs.length === 0 ? (
            <p>No conversation logs found. Start a chat to create some logs!</p>
          ) : (
            <p>No conversations match your current filters. Try adjusting your search or filter settings.</p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredLogs.map((log) => (
            <div key={log.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row justify-between items-start mb-3 pb-2 border-b">
                <div>
                  <span className="text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                  <span className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                    {log.llmUsed}
                  </span>
                </div>
                <div className="flex space-x-2 mt-2 sm:mt-0">
                  <button
                    onClick={() => handleRate(log.id, true)}
                    className={`p-2 rounded-full ${
                      log.rating === true 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                    title="Thumbs up"
                    disabled={isRatingInProgress === log.id}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleRate(log.id, false)}
                    className={`p-2 rounded-full ${
                      log.rating === false 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                    title="Thumbs down"
                    disabled={isRatingInProgress === log.id}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="font-medium text-blue-800 mb-1">User</div>
                <div className="text-gray-800">{log.userMessage}</div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="font-medium text-gray-800 mb-1">AI</div>
                <div className="whitespace-pre-wrap text-gray-700">{log.aiResponse}</div>
              </div>
              
              {isRatingInProgress === log.id && (
                <div className="mt-2 text-sm text-blue-500 flex items-center">
                  <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
                  Updating rating...
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 