---
status: accepted
date: 2026-06-22
---

# Runtime messaging, idempotency, and effects

Clients join the background runtime through a command envelope carrying protocol version, command ID, module, optional expected revision, and a typed command. Handlers validate, deduplicate, load, revision-check, decide, journal or commit, persist outcomes, execute effects idempotently, and publish snapshots in that order. Each module retains the latest two hundred fifty-six completed command outcomes and returns the same response for duplicate delivery. Expected failures use typed safe errors; unexpected exceptions become sanitized diagnostics. Effects are persisted before execution and retries cannot duplicate externally visible outcomes.

## Considered options

- **Fire-and-forget messages without idempotency:** simplest transport but duplicates commands after retry or restart. Rejected because Coin debits, history appends, and browser effects must settle exactly once.
- **Transport-level deduplication only:** helps duplicates but not stale revisions or partial commits. Rejected because modules need revision-aware conflict detection.
- **Synchronous in-process calls only:** adequate for tests but insufficient for Chromium and Safari extension messaging. Rejected because production requires shared contracts across transports.

## Consequences

- Every durable mutation crosses the runtime command path with a stable command ID.
- Stale expected revisions fail safely; clients recover by fetching the current snapshot.
- Effect intents persist with operational commits and roll forward after interruption before external execution retries.
- Unexpected handler exceptions never escape raw to callers or UI.
- In-process, Chromium, and Safari-compatible transports must satisfy the same contract suite.

## Governs

- #36 Make Settings commands revision-safe and replay-safe
- #37 Carry Settings commands through Chromium and Safari messaging
- #38 Persist and execute one effect intent exactly once
- #41 Recover runtime outcomes across worker and failure scenarios
- Epic 3 Runtime and transport (#34) and all later domain command handlers

## Blocked by

- [ADR-0002](./0002-background-runtime-authoritative.md)
- [ADR-0003](./0003-versioned-persistence-single-writer-recovery.md)
