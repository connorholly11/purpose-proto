'use client';

import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';

interface DebugMessage {
  timestamp: Date;
  actionType: string;
  details: string;
}

interface DebugPanelProps {
  messages: DebugMessage[];
  onClose?: () => void;
}

// Helper function to categorize debug messages
const getMessageCategory = (actionType: string): 'rag' | 'user' | 'message' | 'system' | 'error' | 'memory' => {
  if (actionType.includes('RAG') || actionType.includes('CONTEXT')) {
    return 'rag';
  } else if (actionType.includes('USER') || actionType.includes('CONVERSATION')) {
    return 'user';
  } else if (actionType.includes('MESSAGE') || actionType.includes('API')) {
    return 'message';
  } else if (actionType.includes('ERROR') || actionType.includes('FAIL')) {
    return 'error';
  } else if (actionType.includes('SUMMARIZATION') || actionType.includes('MEMORY')) {
    return 'memory';
  } else {
    return 'system';
  }
};

// Helper function to get category style
const getCategoryStyles = (category: 'rag' | 'user' | 'message' | 'system' | 'error' | 'memory') => {
  switch (category) {
    case 'rag':
      return 'bg-blue-50 border-l-2 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-300';
    case 'user':
      return 'bg-green-50 border-l-2 border-green-500 text-green-700 dark:bg-green-900/20 dark:border-green-600 dark:text-green-300';
    case 'message':
      return 'bg-purple-50 border-l-2 border-purple-500 text-purple-700 dark:bg-purple-900/20 dark:border-purple-600 dark:text-purple-300';
    case 'memory':
      return 'bg-amber-50 border-l-2 border-amber-500 text-amber-700 dark:bg-amber-900/20 dark:border-amber-600 dark:text-amber-300';
    case 'error':
      return 'bg-red-50 border-l-2 border-red-500 text-red-700 dark:bg-red-900/20 dark:border-red-600 dark:text-red-300';
    default:
      return 'bg-gray-50 border-l-2 border-gray-500 text-gray-700 dark:bg-gray-900/20 dark:border-gray-600 dark:text-gray-300';
  }
};

export default function DebugPanel({ messages, onClose }: DebugPanelProps) {
  const [filter, setFilter] = useState<'all' | 'rag' | 'user' | 'message' | 'system' | 'error' | 'memory'>('all');
  
  // Filter messages based on selected category
  const filteredMessages = filter === 'all' 
    ? messages 
    : messages.filter(msg => getMessageCategory(msg.actionType) === filter);

  return (
    <div className="fixed bottom-0 right-0 w-full md:w-96 h-[40vh] bg-white dark:bg-slate-800 shadow-lg rounded-t-lg overflow-hidden z-30 border border-gray-200 dark:border-slate-700">
      <div className="flex justify-between items-center px-4 py-2 bg-gray-100 dark:bg-slate-700">
        <h3 className="font-medium text-gray-700 dark:text-gray-300">Debug Console</h3>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <FaTimes />
          </button>
        )}
      </div>
      
      <div className="flex flex-nowrap overflow-x-auto space-x-1 px-2 py-1 bg-gray-50 dark:bg-slate-800/80">
        <button
          onClick={() => setFilter('all')}
          className={`px-2 py-1 text-xs rounded ${
            filter === 'all' 
              ? 'bg-gray-200 dark:bg-slate-600' 
              : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('rag')}
          className={`px-2 py-1 text-xs rounded ${
            filter === 'rag' 
              ? 'bg-blue-100 dark:bg-blue-900/30' 
              : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600'
          }`}
        >
          RAG
        </button>
        <button
          onClick={() => setFilter('user')}
          className={`px-2 py-1 text-xs rounded ${
            filter === 'user' 
              ? 'bg-green-100 dark:bg-green-900/30' 
              : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600'
          }`}
        >
          User
        </button>
        <button
          onClick={() => setFilter('message')}
          className={`px-2 py-1 text-xs rounded ${
            filter === 'message' 
              ? 'bg-purple-100 dark:bg-purple-900/30' 
              : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600'
          }`}
        >
          Messages
        </button>
        <button
          onClick={() => setFilter('memory')}
          className={`px-2 py-1 text-xs rounded ${
            filter === 'memory' 
              ? 'bg-amber-100 dark:bg-amber-900/30' 
              : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600'
          }`}
        >
          Memory
        </button>
        <button
          onClick={() => setFilter('error')}
          className={`px-2 py-1 text-xs rounded ${
            filter === 'error' 
              ? 'bg-red-100 dark:bg-red-900/30' 
              : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600'
          }`}
        >
          Errors
        </button>
      </div>
      
      <div className="overflow-y-auto h-[calc(100%-80px)] px-2 py-1">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            No debug messages in this category
          </div>
        ) : (
          filteredMessages.map((msg, index) => {
            const category = getMessageCategory(msg.actionType);
            const categoryClass = getCategoryStyles(category);
            
            return (
              <div 
                key={index} 
                className={`p-2 my-1 rounded text-xs ${categoryClass}`}
              >
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{msg.actionType}</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="whitespace-pre-wrap">{msg.details}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
