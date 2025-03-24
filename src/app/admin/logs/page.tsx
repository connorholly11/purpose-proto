'use client';

import { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { FaSearch, FaTrash, FaDownload, FaFilter, FaSync, FaCode } from 'react-icons/fa';

// Define types
type LogEntry = {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  service: string;
  message: string;
  details?: Record<string, any>;
};

// Loading component for suspense
function LogsPageLoading() {
  return <div className="container mx-auto p-4">Loading logs...</div>;
}

export default function AdminLogsPage() {
  return (
    <Suspense fallback={<LogsPageLoading />}>
      <AdminLogsPageContent />
    </Suspense>
  );
}

function AdminLogsPageContent() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [availableServices, setAvailableServices] = useState<string[]>(['all']);
  const [refreshKey, setRefreshKey] = useState(0);

  // Memoize query parameters
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (levelFilter !== 'all') params.append('level', levelFilter);
    if (serviceFilter !== 'all') params.append('service', serviceFilter);
    if (dateRange.from) params.append('dateFrom', dateRange.from);
    if (dateRange.to) params.append('dateTo', dateRange.to);
    return params;
  }, [search, levelFilter, serviceFilter, dateRange.from, dateRange.to]);

  // Fetch logs with useCallback for memoization
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/logs?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.statusText}`);
      }
      
      const data = await response.json();
      setLogs(data.logs || []);
      
      // Extract available services from logs
      const services = Array.from(new Set(data.logs.map((log: LogEntry) => log.service))) as string[];
      setAvailableServices(['all', ...services.filter(Boolean)]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Error fetching logs: ${errorMessage}`);
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  // Fetch logs when component mounts or refreshKey changes
  useEffect(() => {
    fetchLogs();
  }, [refreshKey, fetchLogs]);

  // Clear logs handler
  const clearLogs = useCallback(async () => {
    if (!confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch('/api/logs', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to clear logs: ${response.statusText}`);
      }
      
      setLogs([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Error clearing logs: ${errorMessage}`);
      console.error('Error clearing logs:', err);
    }
  }, []);

  // Handle search form submission
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  }, [fetchLogs]);

  // Handle logs download
  const downloadLogs = useCallback(() => {
    const logText = logs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()} [${log.service}] ${log.message}${
        log.details ? `\nDetails: ${JSON.stringify(log.details, null, 2)}` : ''
      }`
    ).join('\n\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().substring(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [logs]);

  // Memoize log level badge color getter
  const getLogLevelBadgeColor = useCallback((level: string) => {
    switch (level) {
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'warn': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'info': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'debug': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">System Administration Logs</h1>
        
        <div className="flex flex-wrap gap-2">
          <Link 
            href="/logs" 
            className="px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300 rounded flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-gray-600/50"
          >
            <FaCode className="w-3 h-3" /> Developer Logs
          </Link>
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded flex items-center gap-1 hover:bg-blue-200 dark:hover:bg-blue-800/50"
          >
            <FaSync className="w-3 h-3" /> Refresh
          </button>
          
          <button
            onClick={downloadLogs}
            className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded flex items-center gap-1 hover:bg-green-200 dark:hover:bg-green-800/50"
            disabled={logs.length === 0}
          >
            <FaDownload className="w-3 h-3" /> Download
          </button>
          
          <button
            onClick={clearLogs}
            className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded flex items-center gap-1 hover:bg-red-200 dark:hover:bg-red-800/50"
            disabled={logs.length === 0}
          >
            <FaTrash className="w-3 h-3" /> Clear Logs
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search logs..."
                className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <FaSearch />
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
            >
              <option value="all">All Levels</option>
              <option value="error">Error</option>
              <option value="warn">Warning</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
            
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
            >
              {availableServices.map(service => (
                <option key={service} value={service}>
                  {service === 'all' ? 'All Services' : service}
                </option>
              ))}
            </select>
            
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
            >
              <FaFilter className="w-3 h-3" /> Filter
            </button>
          </div>
        </form>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded dark:bg-red-900/20 dark:text-red-300 dark:border-red-700">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 text-center text-gray-500 dark:text-gray-400">
          No logs found.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Message</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {logs.map((log, index) => (
                  <tr 
                    key={index} 
                    className="hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getLogLevelBadgeColor(log.level)}`}>
                        {log.level.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {log.service}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <div>
                        {log.message}
                        {log.details && Object.keys(log.details).length > 0 && (
                          <details className="mt-1">
                            <summary className="text-xs text-blue-500 cursor-pointer">Details</summary>
                            <pre className="text-xs mt-1 p-2 bg-gray-50 dark:bg-slate-900 rounded overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 