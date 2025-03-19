'use client';

import React, { useState, useEffect } from 'react';
import browserLogger from '@/lib/utils/browser-logger';

export default function LogsViewerPage() {
  const [clientLogs, setClientLogs] = useState<string[]>([]);
  const [serverLogs, setServerLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'client' | 'server'>('client');
  const [filter, setFilter] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Load client logs from localStorage
  useEffect(() => {
    try {
      const logsString = localStorage.getItem('app_client_logs') || '[]';
      const logs = JSON.parse(logsString);
      setClientLogs(logs);
    } catch (err) {
      console.error('Failed to load client logs:', err);
    }
  }, [refreshKey]);

  // Load server logs (if available)
  const fetchServerLogs = async () => {
    try {
      const response = await fetch('/api/logs');
      if (response.ok) {
        const data = await response.json();
        setServerLogs(data.logs || []);
      } else {
        console.error('Failed to fetch server logs:', response.status);
      }
    } catch (err) {
      console.error('Error fetching server logs:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'server') {
      fetchServerLogs();
    }
  }, [activeTab, refreshKey]);

  // Filter logs based on search term
  const filteredLogs = (activeTab === 'client' ? clientLogs : serverLogs)
    .filter(log => !filter || log.toLowerCase().includes(filter.toLowerCase()));

  // Download logs
  const handleDownload = () => {
    browserLogger.info('LogsViewer', 'Downloading logs', { type: activeTab });
    if (activeTab === 'client') {
      browserLogger.downloadLogs();
    } else {
      // Create a download for server logs
      const blob = new Blob([serverLogs.join('\n')], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `server-logs-${new Date().toISOString()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Clear logs
  const handleClear = () => {
    if (activeTab === 'client') {
      browserLogger.info('LogsViewer', 'Clearing client logs');
      browserLogger.clearLogs();
      setRefreshKey(prevKey => prevKey + 1);
    } else {
      // If there's an API to clear server logs
      browserLogger.info('LogsViewer', 'Clearing server logs');
      fetch('/api/logs', { method: 'DELETE' })
        .then(() => setRefreshKey(prevKey => prevKey + 1))
        .catch(err => console.error('Failed to clear server logs:', err));
    }
  };

  // Refresh logs
  const handleRefresh = () => {
    browserLogger.info('LogsViewer', 'Refreshing logs', { type: activeTab });
    setRefreshKey(prevKey => prevKey + 1);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Logs Viewer</h1>
      
      <div className="flex justify-between mb-4">
        <div className="flex">
          <button
            onClick={() => setActiveTab('client')}
            className={`px-4 py-2 rounded-l ${
              activeTab === 'client' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Client Logs
          </button>
          <button
            onClick={() => setActiveTab('server')}
            className={`px-4 py-2 rounded-r ${
              activeTab === 'server' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Server Logs
          </button>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Refresh
          </button>
          <button
            onClick={handleDownload}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            Download
          </button>
          <button
            onClick={handleClear}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Clear
          </button>
        </div>
      </div>
      
      <div className="mb-4">
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter logs..."
          className="w-full p-2 border rounded"
        />
      </div>
      
      <div className="bg-gray-800 text-gray-200 p-4 rounded h-[70vh] overflow-auto font-mono text-sm">
        {filteredLogs.length > 0 ? (
          <pre className="whitespace-pre-wrap">
            {filteredLogs.map((log, index) => (
              <div 
                key={index}
                className={`py-1 ${
                  log.includes('[ERROR]') 
                    ? 'text-red-400' 
                    : log.includes('[WARN]') 
                      ? 'text-yellow-400' 
                      : log.includes('[INFO]') 
                        ? 'text-blue-400' 
                        : ''
                }`}
              >
                {log}
              </div>
            ))}
          </pre>
        ) : (
          <div className="text-center text-gray-400 mt-10">
            {filter ? 'No logs match the filter criteria' : 'No logs available'}
          </div>
        )}
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>Total logs: {filteredLogs.length} (showing {Math.min(filteredLogs.length, 1000)} most recent)</p>
      </div>
    </div>
  );
} 