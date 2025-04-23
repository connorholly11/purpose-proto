import { useAuth } from '@clerk/clerk-expo';

/**
 * Returns a function that can be used to retrieve the Clerk JWT
 * without causing circular dependencies between services and context.
 * 
 * @returns A function that resolves to the current user's JWT or null
 */
export function useClerkTokenGetter() {
  const { getToken } = useAuth();
  
  return async (): Promise<string | null> => {
    try {
      return await getToken();
    } catch (error) {
      console.error('[useClerkTokenGetter] Error getting authentication token:', error);
      return null;
    }
  };
}