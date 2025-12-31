import { useState, useEffect, useCallback } from 'react';
import { useStorage } from './StorageContext';

const BLOCKED_SITES_KEY = 'blockedSites';

const DEFAULT_SITES = [
  'youtube.com',
  'instagram.com',
  'facebook.com',
  'messenger.com',
  'web.whatsapp.com',
  'discord.com',
  'tiktok.com',
  'netflix.com',
  'primevideo.com',
  'amazon.com',
  'reddit.com',
];

export const useBlockedSites = () => {
  const { get, set, isReady } = useStorage();
  const [sites, setSites] = useState<string[]>(DEFAULT_SITES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from storage
  useEffect(() => {
    if (isReady && !isLoaded) {
      get<string[]>(BLOCKED_SITES_KEY).then((savedSites) => {
        if (savedSites) {
          setSites(savedSites);
        }
        setIsLoaded(true);
      });
    }
  }, [isReady, isLoaded, get]);

  // Save to storage
  useEffect(() => {
    if (isReady && isLoaded) {
      set(BLOCKED_SITES_KEY, sites);
    }
  }, [sites, isReady, isLoaded, set]);

  const addSite = useCallback((site: string) => {
    setSites((prev) => {
        if (prev.includes(site)) return prev;
        return [...prev, site];
    });
  }, []);

  const removeSite = useCallback((site: string) => {
    setSites((prev) => prev.filter((s) => s !== site));
  }, []);

  return {
    sites,
    addSite,
    removeSite,
    isLoaded,
  };
};
