'use client';

import { useState, useEffect } from 'react';
import { Message } from '@prisma/client';
import { useUser } from '../contexts/UserContext';

export default function LogsPage() {
  const { currentUser } = useUser();
  const [messages, setMessages] = useState<(Message & { conversation: { userId: string | null } })[]>([]);
  const [serverLogs, setServerLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
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
  
  // Set current user as default filter
  useEffect(() => {
    if (currentUser) {
      setFilterUser(currentUser.id);
    }
  }, [currentUser]);
  
  useEffect(() => {
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
          setError(`Failed to fetch logs: ${logsResponse.status}`);
        } else {
          const data = await logsResponse.json();
          setMessages(data.messages || []);
          setServerLogs(data.logs || []);
          setError(null);
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
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchAllData();
  }, [filterUser, filterLiked, filterDateFrom, filterDateTo, filterConversation, searchTerm]);

  if (loading) {
    return <div className="flex justify-center p-8">Loading messages and logs...</div>;
  }
  if (error) {
    return <div className="text-red-500 p-8">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Conversation Logs + Server Logs</h1>
      
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
                    {/* This would need to be updated when we implement message feedback */}
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
          <div className="p-4 max-h-64 overflow-y-auto text-sm text-gray-800">
            {serverLogs.map((line, idx) => (
              <div key={idx} className="mb-1 whitespace-pre-wrap">
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
