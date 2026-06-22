---
status: accepted
date: 2026-06-22
---

# Chromium and Safari adapters with strict Block List enforcement

Platform interfaces are owned inward of Chromium and Safari implementations; adapter contracts prove equivalent behavior. Raw browser APIs remain inside platform adapters rather than UI, Redux, or domain modules. Strict enforcement closes matching normal tabs, remembers URL multiplicity only, and reopens inactive destinations when policy permits. Reconciliation is coalesced and idempotent; private or incognito contexts are excluded. Native applications and full browser-state restoration are documented as unsupported rather than silently approximated.

## Considered options

- **Chromium-only implementation:** fastest path but violates the product requirement for Safari. Rejected because Recess targets both browsers from v1.
- **Preserve full tab state when possible:** kinder UX but inconsistent across browsers and incompatible with strict close-and-reopen enforcement. Rejected in favor of URL-plus-multiplicity restoration only.
- **Native-application blocking in v1:** desirable long term but requires a separate platform capability. Rejected; unsupported destinations return explicit capability results.

## Consequences

- UI, Redux, and domain modules depend on browser-access, alarm, notification, and storage interfaces—not `chrome.*` or Safari globals.
- Block List reconciliation uses one coherent access snapshot and coalesces concurrent triggers safely.
- Tests prove close, remember, and reopen behavior through shared in-memory contracts before browser adapters ship.
- Lookalike hostname rejection, phase and pass matrix decisions, and restoration boundaries are table-tested at the domain seam.

## Governs

- #28 Run the Settings contract against Chromium and Safari storage
- #37 Carry Settings commands through Chromium and Safari messaging
- #45 Contract-test close, remember, and reopen behavior
- #46 Implement Chromium and Safari tab-access adapters
- #47 Reconcile Block List enforcement idempotently
- #48 Restore destinations when access policy changes
- Epic 4 Block List and strict browser enforcement (#42)

## Blocked by

- Issue #16 Align Block List and strict restoration rules
- [ADR-0001](./0001-module-dependency-direction-and-public-entry-points.md)
- [ADR-0004](./0004-runtime-messaging-idempotency-and-effects.md)
