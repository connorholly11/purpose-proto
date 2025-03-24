'use client';

import { useState, useEffect } from 'react';
import { User } from '@prisma/client';
import { useUser } from '../contexts/UserContext';
import { usePathname, useRouter } from 'next/navigation';
import { 
  FaDatabase, 
  FaClipboardList, 
  FaMemory, 
  FaChartLine, 
  FaRobot, 
  FaUserCircle
} from 'react-icons/fa';
import React from 'react';

type ConversationStats = {
  totalConversations: number;
  totalMessages: number;
  averageMessagesPerConversation: number;
  messagesLast24Hours: number;
  activeUserCount: number;
};

type UserWithActivity = User & {
  messageCount: number;
  lastActive: string;
};

export default function AdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<ConversationStats | null>(null);
  const [userActivity, setUserActivity] = useState<UserWithActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Admin tabs
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaUserCircle className="w-4 h-4" /> },
    { id: 'knowledge', label: 'Knowledge Base', icon: <FaDatabase className="w-4 h-4" /> },
    { id: 'prompts', label: 'System Prompts', icon: <FaRobot className="w-4 h-4" /> },
    { id: 'feedback', label: 'Feedback', icon: <FaClipboardList className="w-4 h-4" /> },
    { id: 'memory', label: 'Conversation Memory', icon: <FaMemory className="w-4 h-4" /> },
    { id: 'performance', label: 'Performance', icon: <FaChartLine className="w-4 h-4" /> },
  ];

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);

        // Fetch users
        const usersResponse = await fetch('/api/users');
        if (!usersResponse.ok) throw new Error('Failed to fetch users');
        const usersData = await usersResponse.json();
        setUsers(usersData.users);

        // Fetch stats
        const statsResponse = await fetch('/api/admin/stats');
        if (!statsResponse.ok) throw new Error('Failed to fetch stats');
        const statsData = await statsResponse.json();
        setStats(statsData);

        // Fetch user activity
        const activityResponse = await fetch('/api/admin/user-activity');
        if (!activityResponse.ok) throw new Error('Failed to fetch user activity');
        const activityData = await activityResponse.json();
        setUserActivity(activityData.users);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  // Determine active tab based on pathname
  useEffect(() => {
    if (pathname.includes('/admin/knowledge')) {
      setActiveTab('knowledge');
    } else if (pathname.includes('/admin/prompts')) {
      setActiveTab('prompts');
    } else if (pathname.includes('/admin/feedback')) {
      setActiveTab('feedback');
    } else if (pathname.includes('/admin/memory')) {
      setActiveTab('memory');
    } else if (pathname.includes('/admin/performance')) {
      setActiveTab('performance');
    } else {
      setActiveTab('dashboard');
    }
  }, [pathname]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newUserName }),
      });

      if (!response.ok) throw new Error('Failed to create user');
      
      const { user } = await response.json();
      setUsers([user, ...users]);
      setNewUserName('');
    } catch (err) {
      console.error(err);
      alert('Failed to create user');
    }
  };

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    if (tabId === 'knowledge') {
      router.push('/admin/knowledge');
    } else if (tabId === 'prompts') {
      router.push('/admin/prompts');
    } else if (tabId === 'feedback') {
      router.push('/admin/feedback');
    } else if (tabId === 'memory') {
      router.push('/admin/memory');
    } else if (tabId === 'performance') {
      router.push('/admin/performance');
    } else {
      setActiveTab(tabId);
    }
  };

  if (loading) return <div className="flex justify-center p-8">Loading admin data...</div>;
  if (error) return <div className="text-red-500 p-8">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* Admin Tabs */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex space-x-1 border-b border-gray-200 pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2 rounded-t-lg flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 border-b-2 border-blue-500 font-medium'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content area - only show if activeTab is dashboard */}
      {activeTab === 'dashboard' && (
        <>
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold text-gray-500">Total Conversations</h3>
                <p className="text-3xl font-bold">{stats.totalConversations}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold text-gray-500">Total Messages</h3>
                <p className="text-3xl font-bold">{stats.totalMessages}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold text-gray-500">Messages (Last 24h)</h3>
                <p className="text-3xl font-bold">{stats.messagesLast24Hours}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold text-gray-500">Avg. Messages/Conversation</h3>
                <p className="text-3xl font-bold">{stats.averageMessagesPerConversation.toFixed(1)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold text-gray-500">Active Users</h3>
                <p className="text-3xl font-bold">{stats.activeUserCount}</p>
              </div>
            </div>
          )}
          
          {/* User Management Section */}
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-semibold mb-4">User Management</h2>
            
            <form onSubmit={handleCreateUser} className="mb-6 flex gap-2">
              <input
                type="text"
                placeholder="Enter user name"
                className="flex-grow p-2 border rounded"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                required
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add User
              </button>
            </form>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className={currentUser?.id === user.id ? 'bg-blue-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.id.slice(0, 8)}...
                        {currentUser?.id === user.id && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Current
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.name || 'Anonymous'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Activity Section */}
          {userActivity.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">User Activity</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Messages</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userActivity.map((user) => (
                      <tr key={user.id} className={currentUser?.id === user.id ? 'bg-blue-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.name || 'Anonymous'}
                          {currentUser?.id === user.id && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Current
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.messageCount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.lastActive).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 