'use client';

import { useState, useEffect, useMemo } from 'react';
import { FaTrash, FaFilter } from 'react-icons/fa';

interface Feedback {
  id: string;
  category: string;
  content: string;
  userId?: string;
  user?: {
    name?: string;
  };
  screenshot?: string;
  createdAt: string;
}

export default function FeedbackAdminPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [filteredFeedback, setFilteredFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Fetch all feedback
  useEffect(() => {
    async function fetchFeedback() {
      try {
        setLoading(true);
        const response = await fetch('/api/feedback');
        
        if (response.ok) {
          const data = await response.json();
          setFeedback(data.feedback);
          setFilteredFeedback(data.feedback);
        } else {
          setError('Failed to fetch feedback');
        }
      } catch (err) {
        console.error('Error fetching feedback:', err);
        setError('An error occurred while fetching feedback');
      } finally {
        setLoading(false);
      }
    }
    
    fetchFeedback();
  }, []);
  
  // Use memoized filtering for better performance
  useMemo(() => {
    if (selectedCategory === 'all') {
      setFilteredFeedback(feedback);
    } else {
      setFilteredFeedback(feedback.filter(item => item.category === selectedCategory));
    }
  }, [selectedCategory, feedback]);
  
  // Get unique categories for filter options
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(feedback.map(item => item.category)));
    return ['all', ...uniqueCategories];
  }, [feedback]);
  
  // Delete feedback
  const handleDeleteFeedback = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setFeedback(feedback.filter(item => item.id !== id));
      } else {
        setError('Failed to delete feedback');
      }
    } catch (err) {
      console.error('Error deleting feedback:', err);
      setError('An error occurred while deleting feedback');
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">User Feedback</h1>
      
      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">{error}</div>}
      
      {/* Filters */}
      <div className="mb-6">
        <div className="flex items-center space-x-2">
          <FaFilter className="text-gray-500" />
          <span className="text-gray-700">Filter by category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Feedback List */}
      {loading ? (
        <div className="text-center p-4">Loading feedback...</div>
      ) : filteredFeedback.length === 0 ? (
        <div className="text-center p-4">No feedback found.</div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredFeedback.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  item.category === 'positive' ? 'bg-green-100 text-green-800'
                  : item.category === 'neutral' ? 'bg-blue-100 text-blue-800'
                  : item.category === 'negative' ? 'bg-red-100 text-red-800'
                  : ''
                }`}>
                  {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                </span>
                <button
                  onClick={() => handleDeleteFeedback(item.id)}
                  className="text-red-500 hover:text-red-700"
                  title="Delete feedback"
                >
                  <FaTrash className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-500">{item.content}</p>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <p>From: {item.user?.name || 'Anonymous'}</p>
                <p>{new Date(item.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 