import { useEffect } from 'react';

/**
 * Redirects to main page if user has already completed onboarding
 * NOTE: This hook is now deprecated as MainPage handles onboarding check internally
 */
export const useOnboardingRedirect = () => {
  useEffect(() => {
    // No longer needed - MainPage handles onboarding check internally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount - hasOnboarded is loaded before first render
};
