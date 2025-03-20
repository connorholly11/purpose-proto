'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/app/contexts/UserContext';

interface SystemPrompt {
  id: string;
  name: string;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function SystemPromptsPage() {
  const { currentUser } = useUser();
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<SystemPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newContent, setNewContent] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Fetch system prompts
  useEffect(() => {
    async function fetchSystemPrompts() {
      try {
        setLoading(true);
        const response = await fetch('/api/system-prompts');
        
        if (response.ok) {
          const data = await response.json();
          setSystemPrompts(data.systemPrompts);
        } else {
          console.error('Failed to fetch system prompts');
        }
      } catch (err) {
        console.error('Error fetching system prompts:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSystemPrompts();
  }, []);

  // Add new system prompt
  const handleAddPrompt = async () => {
    if (!newName.trim() || !newContent.trim()) {
      setError('Name and content are required');
      return;
    }
    
    try {
      const response = await fetch('/api/system-prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newName,
          content: newContent,
          status: 'test' // Default to test status
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSystemPrompts([data.systemPrompt, ...systemPrompts]);
        setNewName('');
        setNewContent('');
        setError('');
        setFeedback('System prompt created successfully');
      } else {
        setError('Failed to create system prompt');
      }
    } catch (err) {
      console.error('Error creating system prompt:', err);
      setError('An error occurred while creating the system prompt');
    }
  };

  // Set a prompt as active
  const handleSetActive = async (id: string) => {
    try {
      const response = await fetch(`/api/system-prompts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'active'
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update the prompts list
        setSystemPrompts(systemPrompts.map(prompt =>
          prompt.id === id ? { ...prompt, status: 'active' } : 
          prompt.status === 'active' ? { ...prompt, status: 'inactive' } : prompt
        ));
        setFeedback('System prompt set as active');
      } else {
        setError('Failed to update system prompt');
      }
    } catch (err) {
      console.error('Error updating system prompt:', err);
      setError('An error occurred while updating the system prompt');
    }
  };

  // Delete a prompt
  const handleDeletePrompt = async (id: string) => {
    if (!confirm('Are you sure you want to delete this system prompt?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/system-prompts/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setSystemPrompts(systemPrompts.filter(prompt => prompt.id !== id));
        setFeedback('System prompt deleted successfully');
      } else {
        setError('Failed to delete system prompt');
      }
    } catch (err) {
      console.error('Error deleting system prompt:', err);
      setError('An error occurred while deleting the system prompt');
    }
  };

  // Edit prompt
  const startEditing = (prompt: SystemPrompt) => {
    setSelectedPrompt(prompt);
    setNewName(prompt.name);
    setNewContent(prompt.content);
    setIsEditing(true);
  };

  const handleUpdatePrompt = async () => {
    if (!selectedPrompt) return;
    
    if (!newName.trim() || !newContent.trim()) {
      setError('Name and content are required');
      return;
    }
    
    try {
      const response = await fetch(`/api/system-prompts/${selectedPrompt.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newName,
          content: newContent
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSystemPrompts(systemPrompts.map(prompt =>
          prompt.id === selectedPrompt.id ? { ...prompt, name: newName, content: newContent } : prompt
        ));
        setSelectedPrompt(null);
        setNewName('');
        setNewContent('');
        setIsEditing(false);
        setFeedback('System prompt updated successfully');
      } else {
        setError('Failed to update system prompt');
      }
    } catch (err) {
      console.error('Error updating system prompt:', err);
      setError('An error occurred while updating the system prompt');
    }
  };

  const cancelEdit = () => {
    setSelectedPrompt(null);
    setNewName('');
    setNewContent('');
    setIsEditing(false);
  };

  // Submit feedback for a prompt
  const submitFeedback = async (promptId: string, rating: number) => {
    if (!currentUser?.id) {
      setError('You must be logged in to submit feedback');
      return;
    }
    
    try {
      const response = await fetch(`/api/system-prompts/${promptId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          userId: currentUser.id
        }),
      });
      
      if (response.ok) {
        setFeedback('Thank you for your feedback!');
      } else {
        setError('Failed to submit feedback');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('An error occurred while submitting feedback');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">System Prompts Management</h1>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {feedback && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{feedback}</div>}
      
      {/* Form for adding/editing system prompts */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">{isEditing ? 'Edit System Prompt' : 'Add New System Prompt'}</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter prompt name"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 h-32"
            placeholder="Enter system prompt content"
            required
          />
        </div>
        
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={handleUpdatePrompt}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Update Prompt
              </button>
              <button
                onClick={cancelEdit}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleAddPrompt}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Prompt
            </button>
          )}
        </div>
      </div>
      
      {/* List of system prompts */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">System Prompts</h2>
        
        {loading ? (
          <p>Loading system prompts...</p>
        ) : systemPrompts.length === 0 ? (
          <p>No system prompts available. Add one to get started.</p>
        ) : (
          <div className="space-y-6">
            {systemPrompts.map((prompt) => (
              <div key={prompt.id} className="border p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-medium">{prompt.name}</h3>
                    <div className="text-sm text-gray-500 mb-2">
                      Status: <span className={prompt.status === 'active' ? 'text-green-600 font-semibold' : ''}>{prompt.status}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {prompt.status !== 'active' && (
                      <button
                        onClick={() => handleSetActive(prompt.id)}
                        className="text-sm bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                      >
                        Set Active
                      </button>
                    )}
                    <button
                      onClick={() => startEditing(prompt)}
                      className="text-sm bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePrompt(prompt.id)}
                      className="text-sm bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded mb-3 text-sm">
                  <pre className="whitespace-pre-wrap">{prompt.content}</pre>
                </div>
                
                <div className="mt-3">
                  <div className="text-sm font-medium mb-1">Rate this prompt:</div>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => submitFeedback(prompt.id, rating)}
                        className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 