import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../hooks';
import { selectHasOnboarded } from '../selectors/routingSelectors';

export const useRoutePersistenceRedux = () => {
  const navigate = useNavigate();
  const hasOnboarded = useAppSelector(selectHasOnboarded);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Check onboarding status on mount only (once)
    if (!hasCheckedRef.current) {
      hasCheckedRef.current = true;
      const currentPath = window.location.hash.replace('#', '') || '/';
      if (hasOnboarded && currentPath === '/') {
        navigate('/main', { replace: true });
      }
    }
  }, [hasOnboarded, navigate]);
};
