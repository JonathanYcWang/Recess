import React, { useState } from 'react';
import PrimaryButton from './PrimaryButton';
import Icon from './Icon';
import TimesIcon from '../assets/times.svg?url';
import Toggle from './Toggle';
import styles from './BlockedSites.module.css';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectBlockedSites, selectCloseDistractingSites } from '../store/selectors';
import {
  addBlockedSite,
  removeBlockedSite,
  toggleCloseDistractingSites,
} from '../store/slices/blockedSitesSlice';

const BlockedSites: React.FC = () => {
  const dispatch = useAppDispatch();
  const sites = useAppSelector(selectBlockedSites);
  const closeDistractingSites = useAppSelector(selectCloseDistractingSites);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string>('');

  const isValidDomain = (hostname: string): boolean => {
    // Basic domain validation: must contain at least one dot and valid characters
    // Matches patterns like: example.com, sub.example.com, example.co.uk
    const domainPattern = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
    return domainPattern.test(hostname);
  };

  const isValidUrl = (urlString: string): boolean => {
    try {
      const url = new URL(urlString);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return false;
      }
      return isValidDomain(url.hostname);
    } catch {
      try {
        const url = new URL(`https://${urlString}`);
        return isValidDomain(url.hostname);
      } catch {
        return false;
      }
    }
  };

  const normalizeUrl = (urlString: string): string => {
    const trimmed = urlString.trim().toLowerCase();
    const withoutProtocol = trimmed.replace(/^https?:\/\//, '');
    return withoutProtocol.replace(/\/$/, '');
  };

  const handleAdd = () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue) {
      setError('');
      return;
    }

    const normalizedUrl = normalizeUrl(trimmedValue);

    if (!isValidUrl(trimmedValue)) {
      setError('Please enter a valid URL format (e.g., example.com or https://example.com)');
      return;
    }

    if (sites.includes(normalizedUrl)) {
      setError('This site is already in the blocked list');
      return;
    }

    dispatch(addBlockedSite(normalizedUrl));
    setInputValue('');
    setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div className={styles.blockedSites}>
      <div className={styles.headerContainer}>
        <p className={styles.header}>Blocked Sites</p>
        <p className={styles.caption}>Manage sites that should be blocked during focus time.</p>
      </div>

      <div
        className={styles.toggleContainer}
        onClick={() => dispatch(toggleCloseDistractingSites())}
      >
        <Toggle isOn={closeDistractingSites} />
        <span className={styles.toggleLabel}>Close Distracting Sites</span>
      </div>

      <div className={styles.contentContainer}>
        <div className={styles.inputContainer}>
          <input
            type="text"
            className={styles.input}
            placeholder="Enter site URL or name"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError('');
            }}
            onKeyDown={handleKeyDown}
          />
          <PrimaryButton text="Add" onClick={handleAdd} />
        </div>
        {error && <p className={styles.errorMessage}>{error}</p>}
        <div className={styles.sitesList}>
          {sites.map((site) => (
            <div key={site} className={styles.siteItem}>
              <p className={styles.siteName}>{site}</p>
              <Icon
                src={TimesIcon}
                alt="Remove"
                size={9}
                onClick={() => dispatch(removeBlockedSite(site))}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlockedSites;
