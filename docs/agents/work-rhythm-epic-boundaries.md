# Work Rhythm Epic Boundaries

Epic #56 (`#57`–`#65`) delivers the authoritative Work rhythm runtime for Focus Blocks, Time Out, extensions, streak coins, Wind-Down, and projection wiring.

## Verified in Epic #56

- Start Work Session and durable focus anchors
- Non-final and final Focus Block settlement
- Early Work Session end
- Time Out reports, resume, and long catch-up reconciliation
- Focus Block Streak milestone coins
- Focus Block Extension via declined Recess
- Work Session Extension after permanent original-goal completion
- Wind-Down signals (snapshot cue + capability-aware notification/sound effects)
- Command idempotency, stale revision rejection, effect failure isolation, and handler reload recovery

Automated coverage lives in:

- `src/runtime/integration/workRhythmVerificationMatrix.test.ts`
- `src/runtime/integration/workRhythmBrowserCapabilities.test.ts`
- `src/runtime/background/workRhythmCommandHandler.test.ts`
- Domain tests under `src/modules/work-rhythm/`

UI reads discriminated snapshots through the app-level `startWorkRhythmProjectionSubscription` path and `WorkRhythmProjectionView` without mounted interval orchestration.

## Deferred to Epic 7 (Reward Game / Recess integration)

The following remain outside Epic #56 scope and are intentionally not modeled in `WorkRhythmValue` yet:

- Active `recess` phase with scheduler-finalized Recess duration
- Reward Game rotation, rerolls, Recess Pass issuance, and automatic resolution
- Back to Work Countdown phase transitions
- Work Session clock consumption during Reward Game and Recess (beyond recess-prompt handoff)
- Wind-Down on active Recess deadlines (shared `WindDownPhaseContext` contract exists; no Recess durable phase yet)
- Replacing legacy `useTimer` / `WorkPage` session rendering with full Work rhythm command wiring

Epic 7 should extend the verification matrix with Recess lifecycle rows rather than retrofitting Reward Game behavior into Epic #56 documents.
