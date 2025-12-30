import { useState, useEffect } from 'react';

/**
 * Hook to detect if the extension is running in popup mode (window width <= 600px)
 * vs full window/tab mode
 */
export const usePopupMode = (): boolean => {
  const [isPopup, setIsPopup] = useState(() => {
    // Initial check
    return typeof window !== 'undefined' && window.innerWidth <= 600;
  });

  useEffect(() => {
    const checkPopupMode = () => {
      setIsPopup(window.innerWidth <= 600);
    };

    // Check on mount and window resize
    checkPopupMode();
    window.addEventListener('resize', checkPopupMode);

    return () => {
      window.removeEventListener('resize', checkPopupMode);
    };
  }, []);

  return isPopup;
};

