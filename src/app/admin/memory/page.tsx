'use client';

import React, { useState, useEffect } from 'react';
import { FaMemory, FaUserCircle, FaSyncAlt } from 'react-icons/fa';
import MemoryManager from '@/app/components/MemoryManager';

interface User {
  id: string;
  name: string;
}

interface Conversation {
  id: string;
  createdAt: string;
  lastSummarizedAt?: string;
  messages: { id: string }[];
}

export default function MemoryAdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch users
  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const response = await fetch('/api/users');
        
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || []);
        } else {
          setError('Failed to fetch users');
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('An error occurred while fetching users');
      } finally {
        setLoading(false);
      }
    }
    
    fetchUsers();
  }, []);

  // Fetch conversations for selected user
  useEffect(() => {
    async function fetchConversations() {
      if (!selectedUserId) return;
      
      try {
        setLoading(true);
        setConversations([]);
        
        const response = await fetch(`/api/conversations`, {
          headers: {
            'x-user-id': selectedUserId
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setConversations(data.conversations || []);
          
          // Select first conversation by default
          if (data.conversations?.length > 0) {
            setSelectedConversationId(data.conversations[0].id);
          } else {
            setSelectedConversationId('');
          }
        } else {
          setError('Failed to fetch conversations');
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError('An error occurred while fetching conversations');
      } finally {
        setLoading(false);
      }
    }
    
    if (selectedUserId) {
      fetchConversations();
    }
  }, [selectedUserId]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <FaMemory className="mr-2 text-indigo-600" /> Conversation Memory
        </h1>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User selector */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <FaUserCircle className="mr-2 text-indigo-600" /> Users
          </h2>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading && users.length === 0 ? (
              <div className="text-center text-gray-500 py-4">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="text-center text-gray-500 py-4">No users found</div>
            ) : (
              users.map(user => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`w-full px-3 py-2 text-left rounded-md ${
                    selectedUserId === user.id
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {user.name || 'Unnamed User'}
                </button>
              ))
            )}
          </div>
        </div>
        
        {/* Conversation selector */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Conversations</h2>
            <button
              onClick={() => {
                if (selectedUserId) {
                  setConversations([]);
                  setSelectedConversationId('');
                  
                  // Re-trigger the conversations fetch effect
                  const currentUserId = selectedUserId;
                  setSelectedUserId('');
                  setTimeout(() => setSelectedUserId(currentUserId), 10);
                }
              }}
              className="text-indigo-600 hover:text-indigo-800"
              disabled={!selectedUserId || loading}
              title="Refresh conversations"
            >
              <FaSyncAlt className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {!selectedUserId ? (
              <div className="text-center text-gray-500 py-4">Select a user to view conversations</div>
            ) : loading && conversations.length === 0 ? (
              <div className="text-center text-gray-500 py-4">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="text-center text-gray-500 py-4">No conversations found</div>
            ) : (
              conversations.map(conversation => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className={`w-full px-3 py-2 text-left rounded-md ${
                    selectedConversationId === conversation.id
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="text-sm font-medium">
                    {new Date(conversation.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {conversation.messages?.length || 0} messages
                  </div>
                  {conversation.lastSummarizedAt && (
                    <div className="text-xs text-green-600 mt-1">
                      Last summarized: {new Date(conversation.lastSummarizedAt).toLocaleString()}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
        
        {/* Memory component */}
        <div className="md:col-span-1">
          {selectedConversationId ? (
            <MemoryManager conversationId={selectedConversationId} />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-4 h-full flex items-center justify-center text-gray-500">
              Select a conversation to view memory
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 