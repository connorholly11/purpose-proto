'use client';

import { useState, useEffect } from 'react';

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
  
  // Filter feedback by category
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredFeedback(feedback);
    } else {
      setFilteredFeedback(feedback.filter(item => item.category === selectedCategory));
    }
  }, [selectedCategory, feedback]);
  
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
  
  // Get the categories from feedback
  const categories = ['all', ...new Set(feedback.map(item => item.category))];
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">User Feedback</h1>
      
      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">{error}</div>}
      
      {/* Category filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category:</label>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedCategory === category
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Feedback list */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">Loading feedback...</div>
        ) : filteredFeedback.length === 0 ? (
          <div className="p-6 text-center">No feedback found</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredFeedback.map(item => (
              <div key={item.id} className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 mr-2">
                      {item.category}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteFeedback(item.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
                
                <div className="mb-2">
                  <p className="text-gray-800 whitespace-pre-wrap">{item.content}</p>
                </div>
                
                {item.userId && (
                  <div className="text-sm text-gray-500">
                    From: {item.user?.name || item.userId}
                  </div>
                )}
                
                {item.screenshot && (
                  <div className="mt-2">
                    <a 
                      href={item.screenshot} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      View Screenshot
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 