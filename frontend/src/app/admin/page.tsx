'use client';

import { useState, useEffect } from 'react';
import { getStats, getAdminLogs, getUsers, User, Log } from '@/services/api';

interface Stats {
  userCount: number;
  conversationCount: number;
  messageCount: number;
  averageResponseTime: number;
  tokenUsage: {
    total: number;
    completion: number;
    embedding: number;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'users'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (activeTab === 'dashboard') {
          const statsData = await getStats();
          setStats(statsData);
        } else if (activeTab === 'logs') {
          const logsData = await getAdminLogs();
          setLogs(logsData);
        } else if (activeTab === 'users') {
          const usersData = await getUsers();
          setUsers(usersData);
        }
      } catch (error) {
        console.error(`Error fetching ${activeTab} data:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-800 text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">AI Companion Admin</h1>
        </div>
      </header>

      <div className="container mx-auto py-6 px-4">
        <div className="flex mb-6 border-b">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'dashboard'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-blue-500'
            }`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'logs'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-blue-500'
            }`}
            onClick={() => setActiveTab('logs')}
          >
            Logs
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'users'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-blue-500'
            }`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">Users & Conversations</h2>
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-600">Total Users</p>
                      <p className="text-3xl font-bold">{stats.userCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Conversations</p>
                      <p className="text-3xl font-bold">{stats.conversationCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Messages</p>
                      <p className="text-3xl font-bold">{stats.messageCount}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">Performance</h2>
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-600">Avg. Response Time</p>
                      <p className="text-3xl font-bold">{stats.averageResponseTime.toFixed(2)}ms</p>
                    </div>
                    <div className="pt-4">
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-green-600 h-4 rounded-full"
                          style={{ width: `${Math.min(100, (stats.averageResponseTime / 2000) * 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Fast (&lt;500ms)</span>
                        <span>Slow (&gt;2000ms)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">Token Usage</h2>
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-600">Total Tokens</p>
                      <p className="text-3xl font-bold">{stats.tokenUsage.total.toLocaleString()}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600">Completion</p>
                        <p className="text-xl font-semibold">{stats.tokenUsage.completion.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Embedding</p>
                        <p className="text-xl font-semibold">{stats.tokenUsage.embedding.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="pt-2">
                      <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-4"
                          style={{
                            width: `${(stats.tokenUsage.completion / stats.tokenUsage.total) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Completion: {((stats.tokenUsage.completion / stats.tokenUsage.total) * 100).toFixed(0)}%</span>
                        <span>Embedding: {((stats.tokenUsage.embedding / stats.tokenUsage.total) * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {logs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                            No logs found
                          </td>
                        </tr>
                      ) : (
                        logs.map((log) => (
                          <tr key={log.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  log.type === 'chat'
                                    ? 'bg-green-100 text-green-800'
                                    : log.type === 'error'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {log.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {log.userId || 'System'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                              {log.type === 'chat'
                                ? `Q: ${log.data.query.substring(0, 30)}...`
                                : JSON.stringify(log.data).substring(0, 50) + '...'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Conversations
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{user.name || 'Unknown'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{user.email || 'No email'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.conversationCount || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
