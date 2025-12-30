import { SessionState } from '../storage/types';

/**
 * Determines if the popup should redirect to a new tab based on session state and current route
 * @param sessionState The current session state
 * @param pathname The current route pathname
 * @returns true if should redirect to new tab, false otherwise
 */
export const shouldRedirectPopupToNewTab = (
  sessionState: SessionState,
  pathname: string
): boolean => {
  const isWelcomePage = pathname === '/';
  const isSettingsPage = pathname === '/settings';

  return (
    sessionState === 'BEFORE_SESSION' ||
    sessionState === 'REWARD_SELECTION' ||
    isWelcomePage ||
    isSettingsPage
  );
};

/**
 * Gets the target hash route to open in a new tab
 * @param sessionState The current session state
 * @param pathname The current route pathname
 * @returns The hash route to open (e.g., '#/main', '#/settings', '#/')
 */
export const getTargetHashForRedirect = (sessionState: SessionState, pathname: string): string => {
  const isSettingsPage = pathname === '/settings';
  const isWelcomePage = pathname === '/';

  if (isSettingsPage) {
    return '#/settings';
  } else if (isWelcomePage || sessionState === 'BEFORE_SESSION') {
    return '#/';
  } else if (sessionState === 'REWARD_SELECTION') {
    return '#/main';
  }

  // Default to main page
  return '#/main';
};
