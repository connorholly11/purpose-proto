'use client';

import { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import DeleteConfirmation from './DeleteConfirmation';
import { FaUserPlus, FaTrash, FaUserCircle } from 'react-icons/fa';

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
        className="flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium 
                  text-[var(--imessage-blue)] bg-blue-50 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-gray-700 
                  border border-[var(--imessage-border)] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{currentUser?.name || 'Select User'}</span>
        <svg
          className="h-3.5 w-3.5"
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
        <div className="absolute right-0 mt-2 w-60 rounded-xl shadow-lg bg-white dark:bg-gray-800 
                       border border-[var(--imessage-border)] overflow-hidden backdrop-blur-lg z-10">
          <div className="py-1">
            <div className="text-xs text-gray-500 px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <span>Switch Account</span>
              <button 
                onClick={() => {
                  setIsOpen(false);
                  setShowAddUserModal(true);
                }}
                className="text-[var(--imessage-blue)] hover:text-blue-700 transition-colors"
                title="Add new user"
              >
                <FaUserPlus size={14} />
              </button>
            </div>
            {users.map((user) => (
              <div 
                key={user.id}
                className={`block w-full text-left px-4 py-2.5 text-sm ${
                  currentUser?.id === user.id 
                    ? 'bg-blue-50 dark:bg-gray-700' 
                    : 'text-gray-700 dark:text-gray-300'
                } hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex justify-between items-center`}
              >
                <button 
                  onClick={() => handleSelect(user.id)}
                  className="flex items-center flex-1"
                >
                  <div className="w-7 h-7 rounded-full bg-[var(--imessage-blue)] text-white flex items-center justify-center text-xs mr-2">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <span className={currentUser?.id === user.id ? 'text-[var(--imessage-blue)]' : ''}>
                    {user.name || 'Anonymous'}
                  </span>
                </button>
                {currentUser?.id !== user.id && (
                  <button
                    onClick={() => handleDeleteClick(user.id, user.name || 'Anonymous')}
                    className="text-gray-500 hover:text-red-500 px-1 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    title="Delete user"
                  >
                    <FaTrash size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900">
                <FaUserCircle className="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </div>
              <h3 className="mb-4 text-lg font-medium text-center text-gray-900 dark:text-white">
                Add New User
              </h3>
              <div className="mb-4">
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Enter user name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  autoFocus
                />
              </div>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  disabled={!newUserName.trim()}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none ${
                    newUserName.trim()
                      ? 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                      : 'bg-gray-400 cursor-not-allowed'
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