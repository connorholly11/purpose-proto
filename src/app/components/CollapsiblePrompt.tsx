'use client';

import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface CollapsiblePromptProps {
  prompt: {
    id: string;
    name: string;
    content: string;
    status?: string;
  };
}

const CollapsiblePrompt: React.FC<CollapsiblePromptProps> = ({ prompt }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="w-full">
      <button
        onClick={toggleOpen}
        className="flex items-center justify-center space-x-1 text-xs text-gray-500 hover:text-[var(--imessage-blue)] transition w-full px-2 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <span>View {isOpen ? 'Less' : 'Full Prompt'}</span>
        {isOpen ? <FaChevronUp size={8} /> : <FaChevronDown size={8} />}
      </button>
      
      {isOpen && (
        <div className="mt-2 p-3 text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm max-h-48 overflow-y-auto">
          <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed">{prompt.content}</pre>
        </div>
      )}
    </div>
  );
};

export default CollapsiblePrompt; 