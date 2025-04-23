import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useAuth, useUser } from '@clerk/clerk-expo';
import axios from 'axios';
import { useAuthenticatedApi } from '../services/api';
import LegalModal from '../screens/LegalModal';

// SecureStore token cache
const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

// AuthContext type definition
type AuthContextType = {
  isSignedIn: boolean;
  isLoaded: boolean;
  userId: string | null;
  isAdmin: boolean;
  hasAcceptedTerms: boolean;
  termsAcceptanceLoaded: boolean;
  signOut: () => Promise<void>;
};

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  isSignedIn: false,
  isLoaded: false,
  userId: null,
  isAdmin: false,
  hasAcceptedTerms: false,
  termsAcceptanceLoaded: false,
  signOut: async () => {},
});

// Props for the AuthProvider component
type AuthProviderProps = {
  children: ReactNode;
};

// Define founder IDs (admin users)
const FOUNDER_CLERK_IDS = process.env.EXPO_PUBLIC_FOUNDER_CLERK_IDS?.split(',') || [
  'user_2v0kHfelRcU1cBqg5o47ZymuGvM',
  'user_2v0kJwxV4JT2PaJKmaXZabSjFgM',
  'user_2v0kIR1s6RI1tzMU0dF2HhH5LgG',
  'user_2v0kMGsms1l0HxWxbtY3SRkSK9A',
  'user_2v0kLICcJO5KHQhEOlFm9c3ojYn',
  'user_2v0kKj7nLBrJBVE2vtLUburjVm6',
];

// AuthProvider component to wrap the app with auth functionality
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { isSignedIn, isLoaded, userId, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [termsAcceptanceLoaded, setTermsAcceptanceLoaded] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const api = useAuthenticatedApi();

  // Check if the current user is an admin
  useEffect(() => {
    if (isSignedIn && userId) {
      // Make all signed-in users admins
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [isSignedIn, userId]);
  
  // Check if the user has accepted the current terms
  useEffect(() => {
    const checkTermsAcceptance = async () => {
      if (isSignedIn && userId) {
        try {
          setTermsAcceptanceLoaded(false);
          const response = await api.get('/api/legal/acceptance');
          setHasAcceptedTerms(response.data.hasAccepted);
          
          // If the user hasn't accepted terms, show the modal
          if (!response.data.hasAccepted) {
            setShowTermsModal(true);
          }
        } catch (error) {
          console.error('Error checking terms acceptance:', error);
          // Default to true if there's an error to avoid blocking the user
          setHasAcceptedTerms(true);
        } finally {
          setTermsAcceptanceLoaded(true);
        }
      } else {
        setHasAcceptedTerms(false);
        setTermsAcceptanceLoaded(false);
        setShowTermsModal(false);
      }
    };
    
    checkTermsAcceptance();
  }, [isSignedIn, userId]);
  
  // Handle terms acceptance
  const handleTermsAccepted = () => {
    setHasAcceptedTerms(true);
    setShowTermsModal(false);
  };
  
  // We've moved push notification registration to App.tsx using proper hooks

  // --- Add Logging ---
  useEffect(() => {
    console.log('[AuthContext] Clerk State Update:', { 
      isLoaded, 
      isSignedIn, 
      userId,
      hasAcceptedTerms,
      termsAcceptanceLoaded 
    });
  }, [isLoaded, isSignedIn, userId, hasAcceptedTerms, termsAcceptanceLoaded]);
  // --- End Logging ---

  // Context value
  const value: AuthContextType = {
    isSignedIn: isSignedIn || false,
    isLoaded,
    userId: userId || null,
    isAdmin,
    hasAcceptedTerms,
    termsAcceptanceLoaded,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      
      {/* Terms acceptance modal */}
      <LegalModal
        visible={showTermsModal}
        onClose={handleTermsAccepted}
        docType="terms"
        requireAcceptance={true}
      />
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuthContext = () => useContext(AuthContext);

export default AuthContext;