import { useAppDispatch, useAppSelector } from '../hooks';
import { addBlockedSite, removeBlockedSite } from '../slices/blockedSitesSlice';

export const useBlockedSites = () => {
  const dispatch = useAppDispatch();
  const sites = useAppSelector((state) => state.blockedSites.sites);
  const isLoaded = useAppSelector((state) => state.blockedSites.isLoaded);

  return {
    sites,
    isLoaded,
    addSite: (site: string) => dispatch(addBlockedSite(site)),
    removeSite: (site: string) => dispatch(removeBlockedSite(site)),
  };
};
