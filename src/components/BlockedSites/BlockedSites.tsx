// import { useState, type KeyboardEvent } from 'react';
// import { useSelector } from 'react-redux';
// import Button from '../Button/Button';
// import Icon from '../Icon/Icon';
// import TimesIcon from '../../assets/times.svg?url';
// import styles from './BlockedSites.module.css';
// import { selectBlockListEntries } from '../../store/selectors';
// import type { RootState } from '../../store';

// const blockListErrorMessage = (error: { kind: string }): string => {
//   switch (error.kind) {
//     case 'invalid-entry-input':
//       return 'Please enter a valid website (e.g., example.com or https://example.com)';
//     case 'duplicate-entry':
//       return 'This website is already on the Block List';
//     case 'entry-not-found':
//       return 'This website is not on the Block List';
//     case 'transport-unavailable':
//       return 'Block List is temporarily unavailable. Try again after reconnecting.';
//     default:
//       return 'Could not update the Block List. Please try again.';
//   }
// };

// const BlockedSites = () => {
//   const entries = useSelector((state: RootState) => selectBlockListEntries(state));
//   const [inputValue, setInputValue] = useState('');
//   const [error, setError] = useState<string>('');

//   const handleAdd = async () => {
//     const trimmedValue = inputValue.trim();
//     if (!trimmedValue) {
//       setError('');
//       return;
//     }

//     const result = await client.addEntry(trimmedValue, {
//       expectedRevision: revision ?? undefined,
//     });
//     if (!result.ok) {
//       setError(blockListErrorMessage(result.error));
//       return;
//     }

//     setInputValue('');
//     setError('');
//   };

//   const handleRemove = async (hostname: string) => {
//     const client = createAppBlockListClient();
//     if (!client) {
//       setError('Block List is unavailable in this context.');
//       return;
//     }

//     const result = await client.removeEntry(hostname, {
//       expectedRevision: revision ?? undefined,
//     });
//     if (!result.ok) {
//       setError(blockListErrorMessage(result.error));
//     } else {
//       setError('');
//     }
//   };

//   const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
//     if (e.key === 'Enter') {
//       void handleAdd();
//     }
//   };

//   return (
//     <div className={styles.blockedSites}>
//       <div className={styles.headerContainer}>
//         <p className={styles.header}>Block List</p>
//         <p className={styles.caption}>Manage websites that should be blocked during focus time.</p>
//       </div>

//       <div className={styles.contentContainer}>
//         <div className={styles.inputContainer}>
//           <input
//             type="text"
//             className={styles.input}
//             placeholder="Enter website URL or name"
//             value={inputValue}
//             onChange={(e) => {
//               setInputValue(e.target.value);
//               setError('');
//             }}
//             onKeyDown={handleKeyDown}
//             disabled={disconnected}
//           />
//           <Button text="Add" onClick={() => void handleAdd()} variant="primary" />
//         </div>
//         {disconnected && (
//           <p className={styles.errorMessage}>
//             Block List is read-only while disconnected from the background runtime.
//           </p>
//         )}
//         {error && <p className={styles.errorMessage}>{error}</p>}
//         <div className={styles.sitesList}>
//           {entries.map((site) => (
//             <div key={site} className={styles.siteItem}>
//               <p className={styles.siteName}>{site}</p>
//               <Icon src={TimesIcon} alt="Remove" size={9} onClick={() => void handleRemove(site)} />
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default BlockedSites;
