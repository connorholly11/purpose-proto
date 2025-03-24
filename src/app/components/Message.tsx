'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Message as MessageType } from '@/types';
import { FaUser, FaRobot, FaInfoCircle, FaThumbsUp, FaThumbsDown } from 'react-icons/fa';

interface MessageProps {
  message: MessageType;
  showAvatar?: boolean;
  onLike?: () => void;
  onDislike?: () => void;
}

const Message: React.FC<MessageProps> = ({ 
  message, 
  showAvatar = false, 
  onLike, 
  onDislike 
}) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const [feedbackState, setFeedbackState] = useState<'like' | 'dislike' | null>(message.feedback || null);
  const [isDelivered, setIsDelivered] = useState(false);
  const [showImpact, setShowImpact] = useState(true);
  const [showSentEffect, setShowSentEffect] = useState(isUser);
  const messageRef = useRef<HTMLDivElement>(null);
  
  // Message bubble impact effect on first render
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowImpact(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Simulate message delivery status with ping sound effect
  useEffect(() => {
    if (isUser) {
      // First animate the ping effect
      const pingTimer = setTimeout(() => {
        setShowSentEffect(false);
      }, 500);
      
      // Then show delivered status
      const deliveredTimer = setTimeout(() => {
        setIsDelivered(true);
      }, 800);
      
      return () => {
        clearTimeout(pingTimer);
        clearTimeout(deliveredTimer);
      };
    }
  }, [isUser]);
  
  // Fetch feedback status when component mounts
  useEffect(() => {
    if (message.id && !message.id.startsWith('temp') && !isSystem) {
      fetchFeedbackStatus();
    }
  }, [message.id, isSystem]);
  
  const fetchFeedbackStatus = async () => {
    try {
      const response = await fetch(`/api/messages/${message.id}/feedback`);
      if (response.ok) {
        const data = await response.json();
        if (data.feedback) {
          setFeedbackState(data.feedback);
        }
      }
    } catch (error) {
      console.error('Error fetching feedback status:', error);
    }
  };
  
  const handleLike = () => {
    if (feedbackState === 'like') return;
    setFeedbackState('like');
    onLike?.();
  };
  
  const handleDislike = () => {
    if (feedbackState === 'dislike') return;
    setFeedbackState('dislike');
    onDislike?.();
  };

  // Show appropriate avatar based on role
  const renderAvatar = () => {
    if (!showAvatar) return null;
    
    if (isUser) {
      return (
        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-300 mr-2">
          <FaUser size={14} />
        </div>
      );
    } else if (isSystem) {
      return (
        <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-300 mr-2">
          <FaInfoCircle size={14} />
        </div>
      );
    } else {
      return (
        <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-300 mr-2">
          <FaRobot size={14} />
        </div>
      );
    }
  };

  // Format timestamp properly
  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div 
      ref={messageRef}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${isSystem ? 'my-2' : 'my-4'} transition-opacity duration-300 ease-in-out opacity-100`}
    >
      {!isUser && renderAvatar()}
      
      <div 
        className={`relative max-w-[85%] sm:max-w-[75%] md:max-w-[70%] ${
          isSystem 
            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800/30 w-full text-center text-xs'
            : isUser
              ? 'bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100 px-4 py-3 rounded-2xl rounded-tr-none shadow-sm'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm'
        } ${
          message.isLoading ? 'animate-pulse' : ''
        } ${
          showImpact ? isUser ? 'animate-message-impact-right' : 'animate-message-impact-left' : ''
        }`}
      >
        {message.isLoading ? (
          <div className="flex space-x-1 justify-center items-center py-1">
            <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        ) : (
          <div className="whitespace-pre-wrap break-words text-sm">
            {message.content}
            
            {!isSystem && (
              <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 flex justify-between items-center">
                <span>{formatTimestamp(message.timestamp)}</span>
                
                {isUser && isDelivered && (
                  <span>Delivered</span>
                )}
                
                {!isUser && (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleLike}
                      className={`opacity-60 hover:opacity-100 ${feedbackState === 'like' ? 'text-green-500 opacity-100' : ''}`}
                      aria-label="Like message"
                    >
                      <FaThumbsUp size={12} />
                    </button>
                    <button
                      onClick={handleDislike}
                      className={`opacity-60 hover:opacity-100 ${feedbackState === 'dislike' ? 'text-red-500 opacity-100' : ''}`}
                      aria-label="Dislike message"
                    >
                      <FaThumbsDown size={12} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {isUser && renderAvatar()}
    </div>
  );
};

export default Message; 