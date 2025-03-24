'use client';

import React, { useState, useEffect } from 'react';

interface DeleteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType: string;
  errorMessage?: string | null;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType,
  errorMessage
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [doubleConfirm, setDoubleConfirm] = useState(false);
  
  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setDoubleConfirm(false);
      setConfirmationText('');
    }
  }, [isOpen]);

  if (!isOpen) return null;
  
  const handleFirstConfirm = () => {
    setDoubleConfirm(true);
  };
  
  const handleFinalConfirm = () => {
    onConfirm();
    // Don't reset state or close here - let the parent component handle it based on success/failure
  };
  
  const handleCancel = () => {
    setDoubleConfirm(false);
    setConfirmationText('');
    onClose();
  };
  
  const isDeleteEnabled = confirmationText.toLowerCase() === 'delete';
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-sm">
              <p><strong>Error:</strong> {errorMessage}</p>
            </div>
          )}
          
          {!doubleConfirm ? (
            // First confirmation
            <>
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900">
                <svg className="w-6 h-6 text-red-600 dark:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-medium text-center text-gray-900 dark:text-white">
                Delete {itemType}
              </h3>
              <p className="mb-4 text-sm text-center text-gray-600 dark:text-gray-400">
                Are you sure you want to delete <span className="font-semibold">{itemName}</span>? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFirstConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Yes, Delete
                </button>
              </div>
            </>
          ) : (
            // Second confirmation
            <>
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900">
                <svg className="w-6 h-6 text-red-600 dark:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-medium text-center text-gray-900 dark:text-white">
                Final Confirmation
              </h3>
              <p className="mb-4 text-sm text-center text-gray-600 dark:text-gray-400">
                Please type <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">delete</span> to confirm you want to permanently delete <span className="font-semibold">{itemName}</span>.
              </p>
              <div className="mb-4">
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="Type 'delete' to confirm"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-center"
                />
              </div>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinalConfirm}
                  disabled={!isDeleteEnabled}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none ${
                    isDeleteEnabled
                      ? 'bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  Permanently Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation; 