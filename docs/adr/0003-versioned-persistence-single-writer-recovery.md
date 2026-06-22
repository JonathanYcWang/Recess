---
status: accepted
date: 2026-06-22
---

# Versioned persistence and single-writer recovery

Only the background runtime writes durable application state. Each domain aggregate owns a versioned, revisioned document and a handwritten codec with explicit defaults. A serialized transaction journal commits operational mutations and rolls incomplete work forward after interruption. Operational state uses extension-local storage; Work History uses IndexedDB; diagnostics are sanitized and bounded to five hundred entries. Versioned export and confirmed delete-all are included. Legacy migration and import are excluded because Recess has no production users.

## Considered options

- **Redux shape as wire format:** minimizes migration work but couples UI cache to persistence and prevents independent validation. Rejected because hydration currently replays Redux actions and obscures ownership.
- **Multiple writers with last-write-wins:** simpler concurrency but loses revision safety and effect ordering. Rejected because command retries and UI/background races need explicit conflicts.
- **Full event sourcing for operational state:** strong replay but heavy for current scope. Rejected in favor of versioned documents plus append-only Work History facts.

## Consequences

- UI and background read through the public persisted-application-state interface and know no raw storage keys.
- Initialization completes validation, recovery, and default creation before UI rendering or background reconciliation proceeds.
- Corruption defaults only the affected document and records a typed diagnostic.
- Work History never lives in Redux or the operational key-value store.
- Export and delete-all cover every local store without importing deleted data on next launch.

## Governs

- #27 Persist one versioned Settings document through a codec and memory adapter
- #29 Commit Settings revisions through a roll-forward journal
- #30 Initialize registered aggregate documents through one state interface
- #31 Append and query Work History through IndexedDB contracts
- #32 Record sanitized diagnostics in a bounded local ring buffer
- #33 Export and delete all application data
- Epic 2 Persisted application state (#26)

## Blocked by

- [ADR-0002](./0002-background-runtime-authoritative.md)
