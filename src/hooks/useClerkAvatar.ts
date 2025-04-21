import { useUser } from '@clerk/clerk-expo';

export const useClerkAvatar = () => {
  const { user } = useUser();
  const imageUrl = user?.imageUrl;
  // Use first name initial, fallback to 'U' if unavailable
  const initials = user?.firstName?.[0]?.toUpperCase() ?? 'U'; 
  return { imageUrl, initials };
}; 