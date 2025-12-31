import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStorage } from './StorageContext';

const HAS_ONBOARDED_KEY = 'hasOnboarded';

export const useRoutePersistence = () => {
  const navigate = useNavigate();
  const { get, isReady } = useStorage();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Check onboarding status on mount only (once)
    if (isReady && !hasCheckedRef.current) {
      hasCheckedRef.current = true;
      get<boolean>(HAS_ONBOARDED_KEY).then((hasOnboarded) => {
        // If user has onboarded and is currently on the root (welcome) page, redirect to main
        const currentPath = window.location.hash.replace('#', '') || '/';
        if (hasOnboarded && currentPath === '/') {
          navigate('/main', { replace: true });
        }
      });
    }
  }, [isReady, get, navigate]);
};
