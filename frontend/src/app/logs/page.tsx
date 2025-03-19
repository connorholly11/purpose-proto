'use client';

import { useState, useEffect } from 'react';
import { getLogsForUser, rateResponse, LogEntry } from '@/services/api';

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const fetchedLogs = await getLogsForUser();
      setLogs(fetchedLogs);
      setError(null);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Failed to fetch logs. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRate = async (id: string, rating: boolean) => {
    try {
      await rateResponse({ id, rating });
      // Update the local state to reflect the rating
      setLogs(prevLogs => 
        prevLogs.map(log => 
          log.id === id ? { ...log, rating } : log
        )
      );
    } catch (err) {
      console.error('Error rating log:', err);
      setError('Failed to rate the response. Please try again.');
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Conversation History</h1>
          <p className="text-gray-600 mt-2">
            View and rate your past conversations with the AI assistant.
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading logs...</div>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-center">No conversation logs found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-4">
                  <span className="text-sm text-gray-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-medium text-gray-800">User Message:</h3>
                  <p className="mt-1 text-gray-700 whitespace-pre-line">
                    {log.data?.query || 'No message content'}
                  </p>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-medium text-gray-800">AI Response:</h3>
                  <p className="mt-1 text-gray-700 whitespace-pre-line">
                    {log.data?.response || 'No response content'}
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Was this response helpful?</span>
                  <button
                    onClick={() => handleRate(log.id, true)}
                    className={`px-3 py-1 rounded ${
                      log.rating === true
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 hover:bg-green-100'
                    }`}
                  >
                    👍 Yes
                  </button>
                  <button
                    onClick={() => handleRate(log.id, false)}
                    className={`px-3 py-1 rounded ${
                      log.rating === false
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 hover:bg-red-100'
                    }`}
                  >
                    👎 No
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}