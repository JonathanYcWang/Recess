import { useState, type FormEvent } from 'react';
import { useSelector } from 'react-redux';
import { PrimitiveAlert, PrimitiveButton, PrimitiveTextField } from '@/primitives';
import TimesIcon from '../../assets/times.svg?url';
import styles from './BlockedSites.module.css';
import {
  selectBlockListEntries,
  selectBlockListRevision,
  selectIsBlockListDisconnected,
} from '../../store/selectors';
import type { RootState } from '../../store';
import { createAppBlockListClient } from '../../store/blockListClient';

const blockListErrorMessage = (error: { kind: string }): string => {
  switch (error.kind) {
    case 'invalid-entry-input':
      return 'Please enter a valid website (e.g., example.com or https://example.com)';
    case 'duplicate-entry':
      return 'This website is already on the Block List';
    case 'entry-not-found':
      return 'This website is not on the Block List';
    case 'transport-unavailable':
      return 'Block List is temporarily unavailable. Try again after reconnecting.';
    default:
      return 'Could not update the Block List. Please try again.';
  }
};

const BlockedSites = () => {
  const entries = useSelector((state: RootState) => selectBlockListEntries(state));
  const revision = useSelector((state: RootState) => selectBlockListRevision(state));
  const disconnected = useSelector((state: RootState) => selectIsBlockListDisconnected(state));
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string>('');

  const handleAdd = async () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue) {
      setError('');
      return;
    }

    const client = createAppBlockListClient();
    if (!client) {
      setError('Block List is unavailable in this context.');
      return;
    }

    const result = await client.addEntry(trimmedValue, {
      expectedRevision: revision ?? undefined,
    });
    if (!result.ok) {
      setError(blockListErrorMessage(result.error));
      return;
    }

    setInputValue('');
    setError('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleAdd();
  };

  const handleRemove = async (hostname: string) => {
    const client = createAppBlockListClient();
    if (!client) {
      setError('Block List is unavailable in this context.');
      return;
    }

    const result = await client.removeEntry(hostname, {
      expectedRevision: revision ?? undefined,
    });
    if (!result.ok) {
      setError(blockListErrorMessage(result.error));
    } else {
      setError('');
    }
  };

  return (
    <div className={styles.blockedSites}>
      <div className={styles.headerContainer}>
        <p className={styles.header}>Block List</p>
        <p className={styles.caption}>Manage websites that should be blocked during focus time.</p>
      </div>

      <div className={styles.contentContainer}>
        <form className={styles.inputContainer} onSubmit={handleSubmit}>
          <div className={styles.urlField}>
            <PrimitiveTextField
              label="Website URL or name"
              type="url"
              placeholder="Enter website URL or name"
              value={inputValue}
              isDisabled={disconnected}
              isInvalid={Boolean(error)}
              errorMessage={error || undefined}
              onChange={(value) => {
                setInputValue(value);
                if (error) setError('');
              }}
            />
          </div>
          <PrimitiveButton
            className={styles.addButton}
            variant="primary"
            type="submit"
            disabled={disconnected}
          >
            Add
          </PrimitiveButton>
        </form>
        {disconnected && (
          <PrimitiveAlert variant="warning" role="status">
            Block List is read-only while disconnected from the background runtime.
          </PrimitiveAlert>
        )}
        <ul className={styles.sitesList} aria-label="Blocked websites">
          {entries.map((site) => (
            <li key={site} className={styles.siteItem}>
              <span className={styles.siteName}>{site}</span>
              <PrimitiveButton
                type="button"
                variant="ghost"
                className={styles.removeButton}
                aria-label={`Remove ${site}`}
                disabled={disconnected}
                onClick={() => void handleRemove(site)}
              >
                <img src={TimesIcon} alt="" aria-hidden className={styles.removeIcon} />
              </PrimitiveButton>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default BlockedSites;
