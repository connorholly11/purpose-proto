'use client';

import React, { useState } from 'react';

interface DebugMessage {
  timestamp: Date;
  actionType: string;
  details: string;
}

interface DebugPanelProps {
  debugMessages: DebugMessage[];
  onClose: () => void;
}

// Helper function to categorize debug messages
const getMessageCategory = (actionType: string): 'rag' | 'user' | 'message' | 'system' | 'error' => {
  if (actionType.includes('RAG') || actionType.includes('CONTEXT') || actionType === 'COMPLETION_START') {
    return 'rag';
  } else if (actionType.includes('USER') || actionType.includes('CONVERSATION') || actionType === 'NO_CONVERSATIONS') {
    return 'user';
  } else if (actionType.includes('MESSAGE') || actionType.includes('TRANSCRIBE') || actionType.includes('AUDIO') || actionType.includes('VOICE')) {
    return 'message';
  } else if (actionType.includes('ERROR') || actionType.includes('FAIL')) {
    return 'error';
  } else {
    return 'system';
  }
};

// Helper function to get category style
const getCategoryStyles = (category: 'rag' | 'user' | 'message' | 'system' | 'error') => {
  switch (category) {
    case 'rag':
      return 'bg-blue-50 border-l-4 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-300';
    case 'user':
      return 'bg-green-50 border-l-4 border-green-500 text-green-700 dark:bg-green-900/20 dark:border-green-600 dark:text-green-300';
    case 'message':
      return 'bg-purple-50 border-l-4 border-purple-500 text-purple-700 dark:bg-purple-900/20 dark:border-purple-600 dark:text-purple-300';
    case 'error':
      return 'bg-red-50 border-l-4 border-red-500 text-red-700 dark:bg-red-900/20 dark:border-red-600 dark:text-red-300';
    default:
      return 'bg-gray-50 border-l-4 border-gray-500 text-gray-700 dark:bg-gray-900/20 dark:border-gray-600 dark:text-gray-300';
  }
};

export default function DebugPanel({ debugMessages, onClose }: DebugPanelProps) {
  const [filter, setFilter] = useState<'all' | 'rag' | 'user' | 'message' | 'system' | 'error'>('all');
  
  // Filter messages based on selected category
  const filteredMessages = filter === 'all' 
    ? debugMessages 
    : debugMessages.filter(msg => getMessageCategory(msg.actionType) === filter);
  
  return (
    <div className="fixed top-0 right-0 w-full sm:w-96 h-full bg-white dark:bg-slate-800 shadow-lg border-l border-slate-200 dark:border-slate-700 z-50 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
        <h2 className="font-bold text-slate-700 dark:text-slate-200">Debug Logs</h2>
        <button
          onClick={onClose}
          className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
        >
          ✕
        </button>
      </div>
      
      {/* Filter tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 text-sm overflow-x-auto no-scrollbar">
        {['all', 'rag', 'user', 'message', 'system', 'error'].map((category) => (
          <button
            key={category}
            onClick={() => setFilter(category as any)}
            className={`px-3 py-2 font-medium transition-colors ${
              filter === category 
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500' 
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>
      
      <div className="flex-1 overflow-y-auto p-3">
        {filteredMessages.length === 0 ? (
          <div className="text-sm text-slate-500 dark:text-slate-400 p-4 text-center">
            No {filter === 'all' ? '' : filter} debug messages yet.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMessages.map((msg, index) => {
              const category = getMessageCategory(msg.actionType);
              const categoryStyle = getCategoryStyles(category);
              
              return (
                <div 
                  key={index} 
                  className={`text-sm p-2 rounded ${categoryStyle}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-semibold">
                      {msg.actionType}
                    </span>
                    <span className="text-xs opacity-75">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="mt-1 whitespace-pre-wrap break-words text-xs">
                    {msg.details}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Information footer */}
      <div className="p-2 text-xs bg-slate-100 dark:bg-slate-700 border-t border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400">
        <p>
          <span className="font-semibold">RAG:</span> Retrieval & embedding related logs
        </p>
        <p>
          <span className="font-semibold">User:</span> User session and conversation logs
        </p>
      </div>
    </div>
  );
}
