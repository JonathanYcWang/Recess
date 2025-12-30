import React, { useState } from 'react';
import PrimaryButton from './PrimaryButton';
import Icon from './Icon';
import TimesIcon from '../assets/times.svg?url';
import styles from './BlockedSites.module.css';

const defaultSites = [
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

const BlockedSites: React.FC = () => {
  const [sites, setSites] = useState<string[]>(defaultSites);
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
      // Try to create a URL object - if it succeeds, check if it's http/https
      const url = new URL(urlString);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return false;
      }
      // Validate the hostname is a valid domain
      return isValidDomain(url.hostname);
    } catch {
      // If URL constructor throws, try adding https:// prefix
      try {
        const url = new URL(`https://${urlString}`);
        // Validate the hostname is a valid domain
        return isValidDomain(url.hostname);
      } catch {
        return false;
      }
    }
  };

  const normalizeUrl = (urlString: string): string => {
    const trimmed = urlString.trim().toLowerCase();
    // Remove protocol if present
    const withoutProtocol = trimmed.replace(/^https?:\/\//, '');
    // Remove trailing slash
    return withoutProtocol.replace(/\/$/, '');
  };

  const handleAdd = () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue) {
      setError('');
      return;
    }

    const normalizedUrl = normalizeUrl(trimmedValue);

    // Check if it's a valid URL format
    if (!isValidUrl(trimmedValue)) {
      setError('Please enter a valid URL format (e.g., example.com or https://example.com)');
      return;
    }

    // Check for duplicates
    if (sites.includes(normalizedUrl)) {
      setError('This site is already in the blocked list');
      return;
    }

    setSites([...sites, normalizedUrl]);
    setInputValue('');
    setError('');
  };

  const handleRemove = (site: string) => {
    setSites(sites.filter((s) => s !== site));
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
              <Icon src={TimesIcon} alt="Remove" size={9} onClick={() => handleRemove(site)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlockedSites;
