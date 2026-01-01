import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../hooks';

/**
 * Redirects to main page if user has already completed onboarding
 */
export const useOnboardingRedirect = () => {
  const navigate = useNavigate();
  const hasOnboarded = useAppSelector((state) => state.routing.hasOnboarded);

  useEffect(() => {
    // No longer needed - MainPage handles onboarding check internally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount - hasOnboarded is loaded before first render
};
