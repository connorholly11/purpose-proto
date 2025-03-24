'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Message as MessageType } from '@/types';

interface MessageProps {
  message: MessageType;
  onLike?: () => void;
  onDislike?: () => void;
}

const Message: React.FC<MessageProps> = ({ message, onLike, onDislike }) => {
  const isUser = message.role === 'user';
  const [feedbackState, setFeedbackState] = useState<'like' | 'dislike' | null>(null);
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

  // Format timestamp if available
  const formatTime = (timestamp?: Date) => {
    if (!timestamp) return '';
    return timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  // Get message time
  const messageTime = formatTime(message.createdAt);
  
  // Handle long messages on mobile
  const formatContent = (content: string) => {
    const words = content.split(' ');
    // Ensure no word is too long for mobile screens
    const formattedWords = words.map(word => {
      if (word.length > 30) {
        return word.match(/.{1,30}/g)?.join(' ') || word;
      }
      return word;
    });
    return formattedWords.join(' ');
  };
  
  return (
    <div className={`flex w-full my-1.5 sm:my-2 ${isUser ? 'justify-end' : 'justify-start'} relative group`}>
      {/* Message sent ping effect (for user messages) */}
      {isUser && showSentEffect && (
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 message-sent-ping"></div>
      )}
      
      <div
        ref={messageRef}
        style={{
          backgroundColor: isUser 
            ? 'var(--primary-blue)' 
            : 'var(--imessage-gray)',
          color: isUser 
            ? 'var(--imessage-text-white)' 
            : 'var(--imessage-text-black)'
        }}
        className={`
          relative max-w-[80%] sm:max-w-[75%] px-3 sm:px-4 py-2 sm:py-3 mb-1 message-bubble
          ${isUser 
            ? 'rounded-t-2xl rounded-l-2xl animate-[message-out_0.3s_ease]' 
            : 'rounded-t-2xl rounded-r-2xl animate-[message-in_0.3s_ease]'
          }
          ${showImpact ? 'bubble-impact' : ''}
        `}
      >
        <p className="text-[14px] sm:text-[15px] font-normal whitespace-pre-wrap leading-[1.4] sm:leading-[1.5] break-words">
          {formatContent(message.content)}
        </p>
        
        {/* Time and delivered indicator */}
        <div className={`flex items-center justify-end mt-1 ${isUser ? 'text-blue-100 opacity-80' : 'text-slate-500 opacity-70'}`}>
          {isUser && isDelivered && (
            <span className="mr-1 text-[8px] sm:text-[9px] animate-delivered">Delivered</span>
          )}
          <span className="text-[9px] sm:text-[10px]">{messageTime}</span>
        </div>
        
        {/* Tail for the chat bubble with animation */}
        <div 
          style={{
            backgroundColor: isUser 
              ? 'var(--primary-blue)' 
              : 'var(--imessage-gray)'
          }}
          className={`
            absolute bottom-0 w-3 h-3 sm:w-4 sm:h-4 
            ${isUser 
              ? 'right-0 translate-x-2 sm:translate-x-3 -translate-y-1' 
              : 'left-0 -translate-x-2 sm:-translate-x-3 -translate-y-1'
            } 
            rounded-full animate-[bubble-tail-pop_0.3s_ease_0.15s_both]
          `}
        />
        
        {/* Read receipt (blue dot for user messages) */}
        {isUser && isDelivered && (
          <div className="absolute -bottom-3 right-3 sm:right-4 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-delivered"></div>
        )}
        
        {/* Feedback buttons (hidden in iMessage-style but can be toggled) */}
        {!isUser && (onLike || onDislike) && (
          <div className="absolute -bottom-6 right-2 flex space-x-1 sm:space-x-2 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity">
            {onLike && (
              <button 
                onClick={handleLike}
                className={`${
                  feedbackState === 'like' 
                    ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                    : 'text-slate-500 hover:text-blue-500 bg-slate-100/80 dark:bg-slate-800/80'
                } transition-colors p-1 rounded-full shadow-sm text-xs sm:text-sm`}
                aria-label="Like message"
              >
                👍
              </button>
            )}
            
            {onDislike && (
              <button 
                onClick={handleDislike}
                className={`${
                  feedbackState === 'dislike' 
                    ? 'text-red-500 bg-red-50 dark:bg-red-900/30' 
                    : 'text-slate-500 hover:text-red-500 bg-slate-100/80 dark:bg-slate-800/80'
                } transition-colors p-1 rounded-full shadow-sm text-xs sm:text-sm`}
                aria-label="Dislike message"
              >
                👎
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message; 