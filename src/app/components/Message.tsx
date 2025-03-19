'use client';

import React from 'react';
import { FaUser, FaRobot, FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import { Message as MessageType } from '@/types';

interface MessageProps {
  message: MessageType;
  onLike?: () => void;
  onDislike?: () => void;
}

const Message: React.FC<MessageProps> = ({ message, onLike, onDislike }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-lg p-3 ${
          isUser
            ? 'bg-blue-500 text-white rounded-tr-none'
            : 'bg-gray-200 text-gray-800 rounded-tl-none'
        }`}
      >
        <div className="flex items-center mb-1">
          {isUser ? (
            <>
              <span className="font-medium mr-2">You</span>
              <FaUser size={12} />
            </>
          ) : (
            <>
              <span className="font-medium mr-2">AI</span>
              <FaRobot size={12} />
            </>
          )}
        </div>
        <p className="whitespace-pre-wrap">{message.content}</p>
        
        {!isUser && (onLike || onDislike) && (
          <div className="flex mt-2 space-x-2 justify-end">
            {onLike && (
              <button 
                onClick={onLike}
                className="text-gray-500 hover:text-green-500 transition-colors"
                aria-label="Like message"
              >
                <FaThumbsUp size={14} />
              </button>
            )}
            
            {onDislike && (
              <button 
                onClick={onDislike}
                className="text-gray-500 hover:text-red-500 transition-colors"
                aria-label="Dislike message"
              >
                <FaThumbsDown size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message; 