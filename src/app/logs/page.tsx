'use client';

import { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { useUser } from '../contexts/UserContext';
import { useRouter, useSearchParams } from 'next/navigation';
import browserLogger from '@/lib/utils/browser-logger';
import Link from 'next/link';
import { FaCog, FaSearch, FaTrash, FaDownload, FaFilter, FaSync } from 'react-icons/fa';

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
  const [messages, setMessages] = useState<any[]>([]);
  const [serverLogs, setServerLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [filterUser, setFilterUser] = useState<string | null>(null);
  const [filterLiked, setFilterLiked] = useState<boolean | null>(null);
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterConversation, setFilterConversation] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // For dropdown options
  const [users, setUsers] = useState<{ id: string, name: string }[]>([]);
  const [conversations, setConversations] = useState<{ id: string, createdAt: string }[]>([]);
  
  // System logs tab state
  const [clientLogs, setClientLogs] = useState<string[]>([]);
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
  const handleTabChange = useCallback((tab: 'messages' | 'system') => {
    setActiveTab(tab);
    router.push(`/logs?tab=${tab}`);
  }, [router]);
  
  // Memoize query params to prevent unnecessary re-fetches
  const queryParams = useMemo(() => {
    return new URLSearchParams({
      ...(filterUser ? { userId: filterUser } : {}),
      ...(filterLiked !== null ? { liked: filterLiked.toString() } : {}),
      ...(filterDateFrom ? { dateFrom: filterDateFrom } : {}),
      ...(filterDateTo ? { dateTo: filterDateTo } : {}),
      ...(filterConversation ? { conversationId: filterConversation } : {}),
      ...(searchTerm ? { search: searchTerm } : {}),
    });
  }, [filterUser, filterLiked, filterDateFrom, filterDateTo, filterConversation, searchTerm]);
  
  // Data fetching
  const fetchAllData = useCallback(async () => {
    if (activeTab !== 'messages') return;
    
    try {
      setLoading(true);

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

      // Fetch users and conversations only if they haven't been loaded yet
      if (users.length === 0) {
        const usersRes = await fetch('/api/users');
        if (usersRes.ok) {
          const userData = await usersRes.json();
          setUsers(userData.users || []);
        } else {
          console.error(`Failed to fetch users: ${usersRes.status} ${usersRes.statusText}`);
          setUsers([]);
        }
      }

      if (conversations.length === 0) {
        const convoRes = await fetch('/api/conversations');
        if (convoRes.ok) {
          const convoData = await convoRes.json();
          setConversations(convoData.conversations || []);
        } else {
          console.error(`Failed to fetch conversations: ${convoRes.status} ${convoRes.statusText}`);
          setConversations([]);
        }
      }
    } catch (err) {
      console.error('Error fetching messages/logs:', err);
      setMessages([]);
      setServerLogs([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, queryParams, users.length, conversations.length]);
  
  useEffect(() => {
    if (activeTab === 'messages') {
      fetchAllData();
    }
  }, [activeTab, fetchAllData]);
  
  // System logs tab data fetching
  const fetchClientLogs = useCallback(() => {
    try {
      const logsString = localStorage.getItem('app_client_logs') || '[]';
      const logs = JSON.parse(logsString);
      setClientLogs(logs);
    } catch (err) {
      console.error('Failed to load client logs:', err);
    }
  }, []);
  
  const fetchServerLogs = useCallback(async () => {
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
  }, []);
  
  useEffect(() => {
    if (activeTab !== 'system') return;
    
    fetchClientLogs();
    
    if (systemActiveTab === 'server') {
      fetchServerLogs();
    }
  }, [activeTab, systemActiveTab, refreshKey, fetchClientLogs, fetchServerLogs]);
  
  // Filter logs based on search term
  const filteredSystemLogs = useMemo(() => {
    const logs = systemActiveTab === 'client' ? clientLogs : serverLogs;
    return logs.filter(log => !systemFilter || log.toLowerCase().includes(systemFilter.toLowerCase()));
  }, [systemActiveTab, clientLogs, serverLogs, systemFilter]);
  
  // Log actions
  const handleDownload = useCallback(() => {
    browserLogger.info('LogsViewer', 'Downloading logs', { type: systemActiveTab });
    if (systemActiveTab === 'client') {
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
  }, [systemActiveTab, serverLogs]);
  
  const handleClear = useCallback(() => {
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
  }, [systemActiveTab]);
  
  const handleRefresh = useCallback(() => {
    browserLogger.info('LogsViewer', 'Refreshing logs', { type: systemActiveTab });
    setRefreshKey(prevKey => prevKey + 1);
  }, [systemActiveTab]);
  
  if (loading && activeTab === 'messages') {
    return <div className="flex justify-center p-8">Loading messages and logs...</div>;
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Developer Logs & Diagnostics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View message history and system logs for debugging purposes.
          </p>
        </div>
        <Link 
          href="/admin/logs" 
          className="px-3 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded flex items-center gap-1 hover:bg-blue-200 dark:hover:bg-blue-800/50"
        >
          <FaCog className="w-3 h-3" /> Admin Logs
        </Link>
      </div>
      
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
      {activeTab === 'messages' ? (
        <MessageLogsTab 
          messages={messages} 
          users={users}
          conversations={conversations}
          filterUser={filterUser}
          setFilterUser={setFilterUser}
          filterLiked={filterLiked}
          setFilterLiked={setFilterLiked}
          filterDateFrom={filterDateFrom}
          setFilterDateFrom={setFilterDateFrom}
          filterDateTo={filterDateTo}
          setFilterDateTo={setFilterDateTo}
          filterConversation={filterConversation}
          setFilterConversation={setFilterConversation}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onSubmit={fetchAllData}
        />
      ) : (
        <SystemLogsTab
          systemActiveTab={systemActiveTab}
          setSystemActiveTab={setSystemActiveTab}
          systemFilter={systemFilter}
          setSystemFilter={setSystemFilter}
          filteredSystemLogs={filteredSystemLogs}
          handleDownload={handleDownload}
          handleClear={handleClear}
          handleRefresh={handleRefresh}
        />
      )}
    </div>
  );
}

// MessageLogsTab prop types
interface MessageLogsTabProps {
  messages: any[];
  users: { id: string; name: string }[];
  conversations: { id: string; createdAt: string }[];
  filterUser: string | null;
  setFilterUser: (value: string | null) => void;
  filterLiked: boolean | null;
  setFilterLiked: (value: boolean | null) => void;
  filterDateFrom: string;
  setFilterDateFrom: (value: string) => void;
  filterDateTo: string;
  setFilterDateTo: (value: string) => void;
  filterConversation: string | null;
  setFilterConversation: (value: string | null) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  onSubmit: () => void;
}

// SystemLogsTab prop types
interface SystemLogsTabProps {
  systemActiveTab: 'client' | 'server';
  setSystemActiveTab: (tab: 'client' | 'server') => void;
  systemFilter: string;
  setSystemFilter: (value: string) => void;
  filteredSystemLogs: string[];
  handleDownload: () => void;
  handleClear: () => void;
  handleRefresh: () => void;
}

function MessageLogsTab({ 
  messages, 
  users,
  conversations,
  filterUser,
  setFilterUser,
  filterLiked,
  setFilterLiked,
  filterDateFrom,
  setFilterDateFrom,
  filterDateTo,
  setFilterDateTo,
  filterConversation,
  setFilterConversation,
  searchTerm,
  setSearchTerm,
  onSubmit
}: MessageLogsTabProps) {
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div>
      {/* Filter Form */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 mb-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search messages..."
              className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <FaSearch />
            </div>
          </div>
          
          {/* User filter */}
          <div>
            <select
              value={filterUser || ''}
              onChange={(e) => setFilterUser(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
          
          {/* Conversation filter */}
          <div>
            <select
              value={filterConversation || ''}
              onChange={(e) => setFilterConversation(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
            >
              <option value="">All Conversations</option>
              {conversations.map(convo => (
                <option key={convo.id} value={convo.id}>
                  {new Date(convo.createdAt).toLocaleString()}
                </option>
              ))}
            </select>
          </div>
          
          {/* Date range filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Date:</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To Date:</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
            />
          </div>
          
          {/* Liked filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Feedback:</label>
            <select
              value={filterLiked === null ? '' : filterLiked.toString()}
              onChange={(e) => {
                const val = e.target.value;
                setFilterLiked(val === '' ? null : val === 'true');
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
            >
              <option value="">All Messages</option>
              <option value="true">Liked</option>
              <option value="false">Not Liked</option>
            </select>
          </div>
          
          <div className="mt-auto">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1"
            >
              <FaFilter className="w-3 h-3" /> Apply Filters
            </button>
          </div>
        </form>
      </div>
      
      {/* Messages Table */}
      {messages.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 text-center text-gray-500 dark:text-gray-400">
          No messages found.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Conversation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Content</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {messages.map((message, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(message.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {message.conversation?.userId || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {message.conversationId}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-md truncate">
                      {message.content}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <span 
                        className={`px-2 py-1 text-xs rounded-full ${
                          message.role === 'user' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' 
                            : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        }`}
                      >
                        {message.role}
                      </span>
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

function SystemLogsTab({
  systemActiveTab,
  setSystemActiveTab,
  systemFilter,
  setSystemFilter,
  filteredSystemLogs,
  handleDownload,
  handleClear,
  handleRefresh
}: SystemLogsTabProps) {
  return (
    <div>
      <div className="mb-6">
        {/* System logs inner tabs */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex">
            <button
              className={`py-2 px-4 ${systemActiveTab === 'client' ? 'bg-gray-200 dark:bg-slate-700 font-medium rounded-t' : 'bg-gray-100 dark:bg-slate-800'}`}
              onClick={() => setSystemActiveTab('client')}
            >
              Client Logs
            </button>
            <button
              className={`py-2 px-4 ${systemActiveTab === 'server' ? 'bg-gray-200 dark:bg-slate-700 font-medium rounded-t' : 'bg-gray-100 dark:bg-slate-800'}`}
              onClick={() => setSystemActiveTab('server')}
            >
              Server Logs
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded flex items-center gap-1 hover:bg-blue-200 dark:hover:bg-blue-800/50"
            >
              <FaSync className="w-3 h-3" /> Refresh
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded flex items-center gap-1 hover:bg-green-200 dark:hover:bg-green-800/50"
              disabled={filteredSystemLogs.length === 0}
            >
              <FaDownload className="w-3 h-3" /> Download
            </button>
            <button
              onClick={handleClear}
              className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded flex items-center gap-1 hover:bg-red-200 dark:hover:bg-red-800/50"
              disabled={filteredSystemLogs.length === 0}
            >
              <FaTrash className="w-3 h-3" /> Clear
            </button>
          </div>
        </div>
        
        {/* Filter */}
        <div className="mb-4 relative">
          <input
            type="text"
            placeholder="Filter logs..."
            className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
            value={systemFilter}
            onChange={(e) => setSystemFilter(e.target.value)}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <FaSearch />
          </div>
        </div>
        
        {/* Log Display */}
        <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm h-96 overflow-y-auto">
          {filteredSystemLogs.length > 0 ? (
            <pre className="whitespace-pre-wrap break-all">
              {filteredSystemLogs.join('\n')}
            </pre>
          ) : (
            <div className="flex justify-center items-center h-full text-gray-500">
              No logs found. {systemFilter ? 'Try changing the filter.' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
