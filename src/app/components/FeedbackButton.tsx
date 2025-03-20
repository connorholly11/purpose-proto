'use client';

import { useState } from 'react';
import FeedbackForm from './FeedbackForm';

const FeedbackButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const openFeedback = () => {
    setIsOpen(true);
  };
  
  const closeFeedback = () => {
    setIsOpen(false);
  };
  
  return (
    <>
      <button
        onClick={openFeedback}
        className="fixed right-4 bottom-4 bg-indigo-600 text-white rounded-full p-3 shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 z-50"
        aria-label="Give Feedback"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="relative max-w-md w-full mx-4">
            <FeedbackForm onClose={closeFeedback} />
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackButton; 