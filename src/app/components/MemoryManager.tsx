import React, { useState, useEffect } from 'react';
import { FaArchive, FaSyncAlt, FaRegClock } from 'react-icons/fa';

interface MemorySummary {
  id: string;
  content: string;
  type: string;
  createdAt: string;
  priority: number;
}

interface MemoryManagerProps {
  conversationId: string;
}

const MemoryManager: React.FC<MemoryManagerProps> = ({ conversationId }) => {
  const [summaries, setSummaries] = useState<MemorySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Fetch conversation summaries
  const fetchSummaries = async () => {
    if (!conversationId) return;
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/conversations/${conversationId}/memory`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch memory: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSummaries(data.summaries || []);
    } catch (err) {
      console.error('Error fetching memory:', err);
      setError('Failed to load conversation memory');
    } finally {
      setLoading(false);
    }
  };

  // Create a new summary
  const createSummary = async (type: string) => {
    if (!conversationId) return;
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/conversations/${conversationId}/memory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create summary');
      }
      
      await fetchSummaries();
    } catch (err) {
      console.error('Error creating memory:', err);
      setError('Failed to create memory summary');
    } finally {
      setLoading(false);
    }
  };

  // Load summaries when conversation changes
  useEffect(() => {
    if (conversationId) {
      fetchSummaries();
    }
  }, [conversationId]);

  // Filter summaries by type
  const filteredSummaries = selectedType === 'all'
    ? summaries
    : summaries.filter(summary => summary.type === selectedType);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Conversation Memory</h2>
        <button
          onClick={() => fetchSummaries()}
          className="text-indigo-600 hover:text-indigo-800"
          disabled={loading}
          title="Refresh memories"
        >
          <FaSyncAlt className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-2 rounded-md mb-3 text-sm">
          {error}
        </div>
      )}
      
      {/* Memory type filters */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-2 py-1 text-xs rounded-full ${
            selectedType === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setSelectedType('short_term')}
          className={`px-2 py-1 text-xs rounded-full ${
            selectedType === 'short_term'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Short Term
        </button>
        <button
          onClick={() => setSelectedType('medium_term')}
          className={`px-2 py-1 text-xs rounded-full ${
            selectedType === 'medium_term'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Medium Term
        </button>
        <button
          onClick={() => setSelectedType('long_term')}
          className={`px-2 py-1 text-xs rounded-full ${
            selectedType === 'long_term'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Long Term
        </button>
      </div>
      
      {/* Create memory actions */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => createSummary('short_term')}
          className="flex items-center px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
          disabled={loading}
        >
          <FaRegClock className="mr-1" /> Short-term Summary
        </button>
        <button
          onClick={() => createSummary('medium_term')}
          className="flex items-center px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
          disabled={loading}
        >
          <FaArchive className="mr-1" /> Medium-term Summary
        </button>
        <button
          onClick={() => createSummary('long_term')}
          className="flex items-center px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
          disabled={loading}
        >
          <FaArchive className="mr-1" /> Long-term Summary
        </button>
      </div>
      
      {/* Summaries list */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {loading && summaries.length === 0 ? (
          <div className="text-center text-gray-500 py-4">Loading memories...</div>
        ) : filteredSummaries.length === 0 ? (
          <div className="text-center text-gray-500 py-4">No memory summaries available</div>
        ) : (
          filteredSummaries.map(summary => (
            <div 
              key={summary.id} 
              className={`p-3 rounded-lg border ${
                summary.type === 'short_term'
                  ? 'border-green-200 bg-green-50'
                  : summary.type === 'medium_term'
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-purple-200 bg-purple-50'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  summary.type === 'short_term'
                    ? 'bg-green-100 text-green-800'
                    : summary.type === 'medium_term'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {summary.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(summary.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm mt-1 text-gray-700 whitespace-pre-wrap">
                {summary.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MemoryManager; 