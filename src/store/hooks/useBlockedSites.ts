import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { addBlockedSite, removeBlockedSite } from '../slices/blockedSitesSlice';
import { selectBlockedSites, selectBlockedSitesIsLoaded } from '../selectors/blockedSitesSelectors';

export const useBlockedSitesRedux = () => {
  const dispatch = useAppDispatch();
  const sites = useAppSelector(selectBlockedSites);
  const isLoaded = useAppSelector(selectBlockedSitesIsLoaded);

  const addSite = useCallback(
    (site: string) => {
      dispatch(addBlockedSite(site));
    },
    [dispatch]
  );

  const removeSite = useCallback(
    (site: string) => {
      dispatch(removeBlockedSite(site));
    },
    [dispatch]
  );

  return {
    sites,
    addSite,
    removeSite,
    isLoaded,
  };
};
