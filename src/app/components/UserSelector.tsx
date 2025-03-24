'use client';

import { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import DeleteConfirmation from './DeleteConfirmation';

const UserSelector = () => {
  const { currentUser, setCurrentUser, users, isLoading, refreshUsers, deleteUser } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string, name: string } | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelect = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
    setIsOpen(false);
  };

  const handleAddUser = async () => {
    if (!newUserName.trim()) return;
    
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newUserName }),
      });
      
      if (response.ok) {
        await refreshUsers();
        setNewUserName('');
        setShowAddUserModal(false);
      }
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleDeleteClick = (userId: string, userName: string) => {
    if (userId === currentUser?.id) {
      alert("You cannot delete the current user. Please switch to another user first.");
      return;
    }
    
    setErrorMessage(null);
    setUserToDelete({ id: userId, name: userName });
    setShowDeleteConfirmation(true);
    setIsOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      await deleteUser(userToDelete.id);
      setUserToDelete(null);
      setShowDeleteConfirmation(false);
    } catch (error) {
      // Display the error message
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete user');
      // Keep the confirmation dialog open
      setShowDeleteConfirmation(true);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading users...</div>;
  }

  return (
    <div className="relative">
      <button
        className="flex items-center space-x-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium 
                  text-[var(--primary-blue)] bg-blue-50/80 dark:bg-slate-800/60 hover:bg-blue-100/80 dark:hover:bg-slate-700/70 
                  border border-blue-100/80 dark:border-slate-700/40 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={currentUser?.name ? `Current user: ${currentUser.name}` : 'Select user'}
      >
        <div className="w-5 h-5 rounded-full bg-[var(--primary-blue)] text-white flex items-center justify-center text-xs mr-1">
          {currentUser?.name?.charAt(0) || 'U'}
        </div>
        <span className="max-w-[80px] sm:max-w-[120px] truncate">{currentUser?.name || 'Select User'}</span>
        <svg
          className="h-3 w-3 flex-shrink-0 ml-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={isOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 sm:w-60 rounded-xl shadow-lg bg-white/95 dark:bg-slate-800/95 
                       border border-slate-200/80 dark:border-slate-700/80 overflow-hidden backdrop-blur-md z-10">
          <div className="py-1">
            <div className="text-xs text-slate-500 dark:text-slate-400 px-3 sm:px-4 py-2 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <span>Switch Account</span>
              <button 
                onClick={() => {
                  setIsOpen(false);
                  setShowAddUserModal(true);
                }}
                className="text-[var(--primary-blue)] hover:text-[var(--primary-blue-dark)] transition-colors"
                title="Add new user"
              >
                <span>➕</span>
              </button>
            </div>
            <div className="max-h-[40vh] overflow-y-auto scrollbar-thin">
              {users.map((user) => (
                <div 
                  key={user.id}
                  className={`block w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm ${
                    currentUser?.id === user.id 
                      ? 'bg-blue-50/80 dark:bg-slate-700/80' 
                      : 'text-slate-700 dark:text-slate-300'
                  } hover:bg-slate-50/80 dark:hover:bg-slate-700/60 transition-colors flex justify-between items-center`}
                >
                  <button 
                    onClick={() => handleSelect(user.id)}
                    className="flex items-center flex-1"
                  >
                    <div className="w-6 h-6 rounded-full bg-[var(--primary-blue)] text-white flex items-center justify-center text-xs mr-2">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                    <span className={`truncate max-w-[120px] ${currentUser?.id === user.id ? 'text-[var(--primary-blue)] font-medium' : ''}`}>
                      {user.name || 'Anonymous'}
                    </span>
                  </button>
                  {currentUser?.id !== user.id && (
                    <button
                      onClick={() => handleDeleteClick(user.id, user.name || 'Anonymous')}
                      className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-slate-100/80 dark:hover:bg-slate-700/80 transition-colors"
                      title="Delete user"
                    >
                      <span>🗑️</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal - Responsive */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-blue-100/80 dark:bg-blue-900/30">
                <span className="text-2xl">👤</span>
              </div>
              <h3 className="mb-4 text-base sm:text-lg font-medium text-center text-slate-900 dark:text-white">
                Add New User
              </h3>
              <div className="mb-4">
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Enter user name"
                  className="w-full px-3 py-2 bg-slate-50/80 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white text-sm sm:text-base"
                  autoFocus
                />
              </div>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100/80 dark:bg-slate-700/70 dark:text-slate-300 rounded-md hover:bg-slate-200/80 dark:hover:bg-slate-600/70 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  disabled={!newUserName.trim()}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                    newUserName.trim()
                      ? 'bg-[var(--primary-blue)] hover:bg-[var(--primary-blue-dark)]'
                      : 'bg-slate-400/80 dark:bg-slate-600/70 cursor-not-allowed'
                  }`}
                >
                  Add User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {userToDelete && (
        <DeleteConfirmation
          isOpen={showDeleteConfirmation}
          onClose={() => {
            setShowDeleteConfirmation(false);
            setUserToDelete(null);
            setErrorMessage(null);
          }}
          onConfirm={handleConfirmDelete}
          itemName={userToDelete.name}
          itemType="User"
          errorMessage={errorMessage}
        />
      )}
    </div>
  );
};

export default UserSelector; 