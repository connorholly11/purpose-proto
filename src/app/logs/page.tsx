'use client';

import { useState, useEffect, Suspense } from 'react';
import { Message } from '@prisma/client';
import { useUser } from '../contexts/UserContext';
import { useRouter, useSearchParams } from 'next/navigation';
import browserLogger from '@/lib/utils/browser-logger';

// Loading component for suspense
function LogsPageLoading() {
  return <div className="container mx-auto p-4">Loading logs...</div>;
}

export default function LogsPage() {
  return (
    <Suspense fallback={<LogsPageLoading />}>
      <LogsPageContent />
    </Suspense>
  );
}

function LogsPageContent() {
  const { currentUser } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'messages' | 'system'>('messages');
  
  // Messages tab state
  const [messages, setMessages] = useState<(Message & { conversation: { userId: string | null } })[]>([]);
  const [serverLogs, setServerLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states for messages tab
  const [filterUser, setFilterUser] = useState<string | null>(null);
  const [filterLiked, setFilterLiked] = useState<boolean | null>(null);
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterConversation, setFilterConversation] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // For user dropdown
  const [users, setUsers] = useState<{ id: string, name: string }[]>([]);
  // For conversation dropdown
  const [conversations, setConversations] = useState<{ id: string, createdAt: string }[]>([]);
  
  // System logs tab state
  const [clientLogs, setClientLogs] = useState<string[]>([]);
  const [systemServerLogs, setSystemServerLogs] = useState<string[]>([]);
  const [systemActiveTab, setSystemActiveTab] = useState<'client' | 'server'>('client');
  const [systemFilter, setSystemFilter] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Set current user as default filter
  useEffect(() => {
    if (currentUser) {
      setFilterUser(currentUser.id);
    }
  }, [currentUser]);
  
  // Set the active tab based on URL query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'messages' || tabParam === 'system') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);
  
  // Update URL when tab changes
  const handleTabChange = (tab: 'messages' | 'system') => {
    setActiveTab(tab);
    router.push(`/logs?tab=${tab}`);
  };
  
  // Messages tab data fetching
  useEffect(() => {
    if (activeTab !== 'messages') return;
    
    async function fetchAllData() {
      try {
        setLoading(true);

        // Build query params
        const queryParams = new URLSearchParams({
          ...(filterUser ? { userId: filterUser } : {}),
          ...(filterLiked !== null ? { liked: filterLiked.toString() } : {}),
          ...(filterDateFrom ? { dateFrom: filterDateFrom } : {}),
          ...(filterDateTo ? { dateTo: filterDateTo } : {}),
          ...(filterConversation ? { conversationId: filterConversation } : {}),
          ...(searchTerm ? { search: searchTerm } : {}),
        });

        const logsResponse = await fetch(`/api/logs?${queryParams.toString()}`);
        if (!logsResponse.ok) {
          console.error(`Failed to fetch logs: ${logsResponse.status} ${logsResponse.statusText}`);
          setMessages([]);
          setServerLogs([]);
        } else {
          const data = await logsResponse.json();
          setMessages(data.messages || []);
          setServerLogs(data.logs || []);
        }

        // get users
        const usersRes = await fetch('/api/users');
        if (usersRes.ok) {
          const userData = await usersRes.json();
          setUsers(userData.users || []);
        } else {
          console.error(`Failed to fetch users: ${usersRes.status} ${usersRes.statusText}`);
          setUsers([]);
        }

        // get conversations
        const convoRes = await fetch('/api/conversations');
        if (convoRes.ok) {
          const convoData = await convoRes.json();
          setConversations(convoData.conversations || []);
        } else {
          console.error(`Failed to fetch conversations: ${convoRes.status} ${convoRes.statusText}`);
          setConversations([]);
        }
      } catch (err) {
        console.error('Error fetching messages/logs:', err);
        setMessages([]);
        setServerLogs([]);
      } finally {
        setLoading(false);
      }
    }

    fetchAllData();
  }, [filterUser, filterLiked, filterDateFrom, filterDateTo, filterConversation, searchTerm, activeTab]);
  
  // System logs tab data fetching
  useEffect(() => {
    if (activeTab !== 'system') return;
    
    try {
      const logsString = localStorage.getItem('app_client_logs') || '[]';
      const logs = JSON.parse(logsString);
      setClientLogs(logs);
    } catch (err) {
      console.error('Failed to load client logs:', err);
    }
  }, [refreshKey, activeTab]);
  
  useEffect(() => {
    if (activeTab !== 'system' || systemActiveTab !== 'server') return;
    
    const fetchServerLogs = async () => {
      try {
        const response = await fetch('/api/logs');
        if (response.ok) {
          const data = await response.json();
          setSystemServerLogs(data.logs || []);
        } else {
          console.error('Failed to fetch server logs:', response.status);
        }
      } catch (err) {
        console.error('Error fetching server logs:', err);
      }
    };
    
    fetchServerLogs();
  }, [refreshKey, systemActiveTab, activeTab]);
  
  // Filter logs based on search term
  const filteredSystemLogs = (systemActiveTab === 'client' ? clientLogs : systemServerLogs)
    .filter(log => !systemFilter || log.toLowerCase().includes(systemFilter.toLowerCase()));
  
  // Download logs
  const handleDownload = () => {
    browserLogger.info('LogsViewer', 'Downloading logs', { type: systemActiveTab });
    if (systemActiveTab === 'client') {
      browserLogger.downloadLogs();
    } else {
      // Create a download for server logs
      const blob = new Blob([systemServerLogs.join('\n')], { type: 'text/plain' });
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
    if (systemActiveTab === 'client') {
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
    browserLogger.info('LogsViewer', 'Refreshing logs', { type: systemActiveTab });
    setRefreshKey(prevKey => prevKey + 1);
  };
  
  if (loading && activeTab === 'messages') {
    return <div className="flex justify-center p-8">Loading messages and logs...</div>;
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Logs</h1>
      
      {/* Tabs */}
      <div className="mb-6 border-b">
        <div className="flex">
          <button
            className={`py-2 px-4 ${activeTab === 'messages' ? 'border-b-2 border-indigo-500 font-medium text-indigo-600' : 'text-gray-500'}`}
            onClick={() => handleTabChange('messages')}
          >
            Message Logs
          </button>
          <button
            className={`py-2 px-4 ${activeTab === 'system' ? 'border-b-2 border-indigo-500 font-medium text-indigo-600' : 'text-gray-500'}`}
            onClick={() => handleTabChange('system')}
          >
            System Logs
          </button>
        </div>
      </div>
      
      {/* Content based on active tab */}
      {activeTab === 'messages' && (
        <div>
          {/* Filter controls */}
          <div className="bg-gray-100 p-4 mb-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* User */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                <select 
                  className="w-full p-2 border rounded"
                  value={filterUser || ''}
                  onChange={(e) => setFilterUser(e.target.value || null)}
                >
                  <option value="">All Users</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name || u.id}</option>
                  ))}
                </select>
              </div>
              
              {/* Feedback */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
                <select 
                  className="w-full p-2 border rounded"
                  value={filterLiked === null ? '' : filterLiked.toString()}
                  onChange={(e) => {
                    if (e.target.value === '') setFilterLiked(null);
                    else setFilterLiked(e.target.value === 'true');
                  }}
                >
                  <option value="">All Messages</option>
                  <option value="true">Liked</option>
                  <option value="false">Disliked</option>
                </select>
              </div>
              
              {/* Conversation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conversation</label>
                <select 
                  className="w-full p-2 border rounded"
                  value={filterConversation || ''}
                  onChange={(e) => setFilterConversation(e.target.value || null)}
                >
                  <option value="">All Conversations</option>
                  {conversations.map((convo) => (
                    <option key={convo.id} value={convo.id}>
                      {new Date(convo.createdAt).toLocaleString()} - {convo.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input 
                  type="date" 
                  className="w-full p-2 border rounded"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                />
              </div>
              
              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input 
                  type="date" 
                  className="w-full p-2 border rounded"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                />
              </div>
              
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded"
                  placeholder="Search message content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {/* Messages list */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
            {messages.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No messages found with the current filters.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feedback</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {messages.map((message) => (
                    <tr key={message.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(message.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          message.role === 'assistant'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {message.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="max-h-24 overflow-y-auto">
                          {message.content}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {message.conversation.userId || 'Anonymous'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="text-gray-500">Not rated</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Server log lines (optional) */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <h2 className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
              Server Log Lines
            </h2>
            {serverLogs.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No server logs found.</div>
            ) : (
              <div className="p-4 max-h-60 overflow-y-auto">
                {serverLogs.map((line, i) => (
                  <div key={i} className="font-mono text-xs mb-1 whitespace-pre-wrap">
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'system' && (
        <div>
          <div className="flex justify-between mb-4">
            <div className="flex">
              <button
                onClick={() => setSystemActiveTab('client')}
                className={`px-4 py-2 rounded-l ${
                  systemActiveTab === 'client' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Client Logs
              </button>
              <button
                onClick={() => setSystemActiveTab('server')}
                className={`px-4 py-2 rounded-r ${
                  systemActiveTab === 'server' 
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
              value={systemFilter}
              onChange={e => setSystemFilter(e.target.value)}
              placeholder="Filter logs..."
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div className="bg-gray-800 text-gray-200 p-4 rounded h-[70vh] overflow-auto font-mono text-sm">
            {filteredSystemLogs.length > 0 ? (
              <pre className="whitespace-pre-wrap">
                {filteredSystemLogs.map((log, index) => (
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
                {systemFilter ? 'No logs match the filter criteria' : 'No logs available'}
              </div>
            )}
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            <p>Total logs: {filteredSystemLogs.length} (showing {Math.min(filteredSystemLogs.length, 1000)} most recent)</p>
          </div>
        </div>
      )}
    </div>
  );
}
