import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStorage } from './StorageContext';

const LAST_ROUTE_KEY = 'lastRoute';

export const useRoutePersistence = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { get, set, isReady } = useStorage();
  const hasRestoredRef = useRef(false);

  useEffect(() => {
    // Load saved route on mount only (once)
    if (isReady && !hasRestoredRef.current) {
      hasRestoredRef.current = true;
      get<string>(LAST_ROUTE_KEY).then((lastRoute) => {
        // Only redirect on initial load if we're on the welcome page and have a saved route
        const currentPath = window.location.hash.replace('#', '') || '/';
        if (lastRoute && lastRoute !== '/' && currentPath === '/') {
          navigate(lastRoute, { replace: true });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]); // Only run when storage becomes ready

  useEffect(() => {
    // Save route whenever it changes (skip the initial restore)
    if (isReady && hasRestoredRef.current && location.pathname) {
      set(LAST_ROUTE_KEY, location.pathname);
    }
  }, [location.pathname, isReady, set]);
};
