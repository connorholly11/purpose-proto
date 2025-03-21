'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/app/contexts/UserContext';

interface KnowledgeItem {
  id: string;
  title?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function KnowledgeBase() {
  const { currentUser } = useUser();
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [error, setError] = useState('');

  // Fetch knowledge items
  useEffect(() => {
    async function fetchKnowledgeItems() {
      if (!currentUser?.id) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/knowledge?userId=${currentUser.id}`);
        
        if (response.ok) {
          const data = await response.json();
          setKnowledgeItems(data.knowledgeItems);
        } else {
          console.error('Failed to fetch knowledge items');
        }
      } catch (err) {
        console.error('Error fetching knowledge items:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchKnowledgeItems();
  }, [currentUser?.id]);

  // Add new knowledge item
  const handleAddKnowledgeItem = async () => {
    if (!currentUser?.id) {
      setError('You must be logged in to add knowledge items');
      return;
    }
    
    if (!newContent.trim()) {
      setError('Content is required');
      return;
    }
    
    try {
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          title: newTitle,
          content: newContent,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setKnowledgeItems([data.knowledgeItem, ...knowledgeItems]);
        setNewTitle('');
        setNewContent('');
        setError('');
      } else {
        setError('Failed to add knowledge item');
      }
    } catch (err) {
      console.error('Error adding knowledge item:', err);
      setError('An error occurred while adding the knowledge item');
    }
  };

  // Delete knowledge item
  const handleDeleteKnowledgeItem = async (id: string) => {
    try {
      const response = await fetch(`/api/knowledge/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setKnowledgeItems(knowledgeItems.filter(item => item.id !== id));
      } else {
        setError('Failed to delete knowledge item');
      }
    } catch (err) {
      console.error('Error deleting knowledge item:', err);
      setError('An error occurred while deleting the knowledge item');
    }
  };

  return (
    <div className="container mx-auto">
      {/* Add new knowledge item form */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Add Knowledge</h2>
        
        {error && <div className="text-red-500 mb-4">{error}</div>}
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Title (Optional)</label>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Optional title for your knowledge item"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 h-32"
            placeholder="Enter knowledge content here"
            required
          />
        </div>
        
        <button
          onClick={handleAddKnowledgeItem}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add Knowledge
        </button>
      </div>
      
      {/* Knowledge items list */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Your Knowledge Base</h2>
        
        {loading ? (
          <p>Loading knowledge items...</p>
        ) : knowledgeItems.length === 0 ? (
          <p>You haven't added any knowledge items yet.</p>
        ) : (
          <div className="space-y-4">
            {knowledgeItems.map((item) => (
              <div key={item.id} className="border-b border-gray-200 pb-4 last:border-0">
                {item.title && <h3 className="text-lg font-medium">{item.title}</h3>}
                <p className="mt-1 text-gray-600">{item.content}</p>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Added: {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleDeleteKnowledgeItem(item.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 