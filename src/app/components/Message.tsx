'use client';

import React, { useState, useEffect } from 'react';
import { FaUser, FaRobot, FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import { Message as MessageType } from '@/types';

interface MessageProps {
  message: MessageType;
  onLike?: () => void;
  onDislike?: () => void;
}

const Message: React.FC<MessageProps> = ({ message, onLike, onDislike }) => {
  const isUser = message.role === 'user';
  const [feedbackState, setFeedbackState] = useState<'like' | 'dislike' | null>(null);
  
  // Fetch feedback status when component mounts
  useEffect(() => {
    if (message.id && !message.id.startsWith('temp')) {
      fetchFeedbackStatus();
    }
  }, [message.id]);
  
  const fetchFeedbackStatus = async () => {
    try {
      const response = await fetch(`/api/message/${message.id}/feedback`);
      if (response.ok) {
        const data = await response.json();
        if (data.feedback) {
          setFeedbackState(data.feedback.type === 'LIKE' ? 'like' : 'dislike');
        }
      }
    } catch (error) {
      console.error('Error fetching feedback status:', error);
    }
  };
  
  const handleLike = () => {
    if (feedbackState === 'like') {
      // Already liked, so do nothing or toggle off
      return;
    }
    
    setFeedbackState('like');
    onLike?.();
  };
  
  const handleDislike = () => {
    if (feedbackState === 'dislike') {
      // Already disliked, so do nothing or toggle off
      return;
    }
    
    setFeedbackState('dislike');
    onDislike?.();
  };
  
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
                onClick={handleLike}
                className={`${
                  feedbackState === 'like' 
                    ? 'text-green-500' 
                    : 'text-gray-500 hover:text-green-500'
                } transition-colors`}
                aria-label="Like message"
              >
                <FaThumbsUp size={14} />
              </button>
            )}
            
            {onDislike && (
              <button 
                onClick={handleDislike}
                className={`${
                  feedbackState === 'dislike' 
                    ? 'text-red-500' 
                    : 'text-gray-500 hover:text-red-500'
                } transition-colors`}
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