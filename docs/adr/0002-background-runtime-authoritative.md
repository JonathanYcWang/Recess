---
status: accepted
date: 2026-06-22
---

# Background runtime is authoritative

The background runtime is the sole durable coordinator for active domain behavior. It owns command ordering, durable settlement, time-based wakeups, effects, and snapshot publication. Pure domain modules remain synchronous and deterministic; React and Redux cannot authoritatively settle elapsed time or durable mutations. Worker sleep and restart are normal operating conditions reconstructed from persisted state. Clock and RandomSource values enter decisions explicitly through handler context.

## Considered options

- **UI-authoritative timers:** matches current implementation but fails when the popup closes or the worker sleeps. Rejected because extension focus behavior must survive UI closure.
- **Shared authority between Redux and background:** allows incremental migration but permits race conditions and duplicate settlement. Rejected because elapsed-time and durable mutations need one writer.
- **Event-sourced operational aggregates:** strong auditability but excessive for v1 with no production users. Rejected in favor of versioned documents plus append-only Work History facts.

## Consequences

- React renders snapshots and sends intent commands; it does not own intervals, alarms, or durable transitions.
- Every time-based domain boundary settles in the background from durable anchors after wake, reload, or worker restart.
- Handlers inject Clock and RandomSource explicitly; domain modules never call `Date.now()` or `Math.random()`.
- Feature work that adds timer authority to hooks, reducers, or views conflicts with this ADR.

## Governs

- #35 Change one Settings preference through the in-process runtime
- #41 Recover runtime outcomes across worker and failure scenarios
- #57 Start a Work Session and its first Focus Block
- #58 Settle durable deadlines through final completion
- #65 Verify Work rhythm timing, failure, and race behavior
- Epic 3 Runtime and transport (#34) and Epic 6 Work rhythm (#56)

## Blocked by

- [ADR-0001](./0001-module-dependency-direction-and-public-entry-points.md)
