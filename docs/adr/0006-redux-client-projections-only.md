---
status: accepted
date: 2026-06-22
---

# Redux limited to client projections

Redux stores shared client projections and their revision or connection state, not persisted aggregate documents or active timer authority. One application-level subscription per domain projection updates Redux instead of competing component subscriptions. Forms, dialogs, animation progress, and other short-lived interaction state remain React-local. React sends intent commands through domain clients and does not construct durable state mutations.

## Considered options

- **Redux as authoritative domain store:** matches current timer implementation but duplicates background truth and breaks after UI closure. Rejected because durable behavior belongs to the background runtime.
- **Duplicate local caches per screen:** reduces subscription wiring but allows divergent snapshots across mounted views. Rejected because Work rhythm screens already mount duplicate orchestration hooks.
- **Eliminate Redux entirely:** simplifies mental model but removes a useful shared projection layer for disconnected read-only UI. Rejected in favor of projection-only Redux with one subscription per domain.

## Consequences

- Redux slices hold caller-safe snapshots, revisions, and connection state—not codec wire shapes or storage keys.
- Components consume selectors and command hooks; they do not dispatch persisted-shape mutations.
- Unmount and remount of consuming components do not multiply domain subscriptions.
- Transport loss keeps the last valid snapshot visible as disconnected read-only state until recovery reconciles revisions.
- New timer, persistence, or enforcement logic in reducers or middleware conflicts with this ADR.

## Governs

- #39 Project Settings snapshots into Redux through one subscription
- #40 Keep Settings read-only while disconnected and retry
- #43 Manage websites through the Block List module
- #82 Manage weekly Work Start Reminders
- All UI migration issues that replace raw Redux mutation with client projections

## Blocked by

- [ADR-0001](./0001-module-dependency-direction-and-public-entry-points.md)
- [ADR-0002](./0002-background-runtime-authoritative.md)
- [ADR-0004](./0004-runtime-messaging-idempotency-and-effects.md)
