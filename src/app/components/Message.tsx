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
  
  return (
    <div className={`flex w-full my-1 ${isUser ? 'justify-end' : 'justify-start'} relative`}>
      {/* Message sent ping effect (for user messages) */}
      {isUser && showSentEffect && (
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 message-sent-ping"></div>
      )}
      
      <div
        ref={messageRef}
        className={`
          relative max-w-[75%] px-4 py-2 mb-1 
          ${isUser 
            ? 'bg-[var(--imessage-blue)] text-[var(--imessage-text-white)] rounded-t-2xl rounded-l-2xl animate-[message-out_0.3s_ease]' 
            : 'bg-[var(--imessage-gray)] text-[var(--imessage-text-black)] rounded-t-2xl rounded-r-2xl animate-[message-in_0.3s_ease]'
          }
          ${showImpact ? 'bubble-impact' : ''}
        `}
      >
        <p className="text-[15px] font-normal whitespace-pre-wrap">{message.content}</p>
        
        {/* Time and delivered indicator */}
        <div className={`flex items-center justify-end mt-0.5 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
          {isUser && isDelivered && (
            <span className="mr-1 text-[9px] animate-delivered">Delivered</span>
          )}
          <span className="text-[10px]">{messageTime}</span>
        </div>
        
        {/* Tail for the chat bubble with animation */}
        <div 
          className={`
            absolute bottom-0 w-4 h-4 
            ${isUser 
              ? 'right-0 translate-x-3 -translate-y-1 bg-[var(--imessage-blue)]' 
              : 'left-0 -translate-x-3 -translate-y-1 bg-[var(--imessage-gray)]'
            } 
            rounded-full animate-[bubble-tail-pop_0.3s_ease_0.15s_both]
          `}
        />
        
        {/* Read receipt (blue dot for user messages) */}
        {isUser && isDelivered && (
          <div className="absolute -bottom-3 right-4 w-2 h-2 bg-blue-500 rounded-full animate-delivered"></div>
        )}
        
        {/* Feedback buttons (hidden in iMessage-style but can be toggled) */}
        {!isUser && (onLike || onDislike) && (
          <div className="flex mt-1 space-x-2 justify-end opacity-40 hover:opacity-100 transition-opacity">
            {onLike && (
              <button 
                onClick={handleLike}
                className={`${
                  feedbackState === 'like' 
                    ? 'text-blue-500' 
                    : 'text-gray-500 hover:text-blue-500'
                } transition-colors text-xs`}
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
                    ? 'text-red-500' 
                    : 'text-gray-500 hover:text-red-500'
                } transition-colors text-xs`}
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