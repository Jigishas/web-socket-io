import { useUser, useAuth } from '@clerk/clerk-react';

export const useClerkAuth = () => {
  const { user } = useUser();
  const { getToken } = useAuth();

  return {
    user,
    getToken,
    isSignedIn: !!user,
  };
};
