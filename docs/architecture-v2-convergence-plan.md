# Architecture v2 convergence plan

Issue: https://github.com/JonathanYcWang/Recess/issues/272

This is an umbrella plan for bringing the codebase into conformance with
`docs/architecture-v2.md`. Do not implement it as one PR.

## Existing issues

- #270: map the codebase to `src/Background`, `src/UI`, and `src/Shared`.
- #271: resolve legacy UI/background bridge code behind one `ActionBroker`.
- #263: keep browser APIs inside approved adapter layers.
- #264: stop UI and store code from bypassing `ActionBroker`.
- #266: move browser storage writes behind `StorageRepository`.
- #267: replace unsafe boundary casts with guards/codecs.
- #268: stop production background composition from using in-memory persistence.
- #265: keep architecture docs pointed at the canonical architecture file.

## Target

Dependency direction:

```text
src/Shared
  no dependency on Background or UI

src/Background
  may depend on Shared
  services receive repositories/adapters as parameters
  adapters/repositories own browser APIs

src/UI
  may depend on Shared
  does not import Background concrete code
  components read Redux through hooks/selectors
```

Data flow:

```text
UI component/hook
  -> Shared/Adapters/ActionBroker.ts
  -> Background worker command/listener
  -> Background/Services/*
  -> Background/Repositories or Background/Adapters
  -> background state/projection
  -> ActionBroker updates Redux
  -> UI selectors/hooks/components
```

Ownership rules:

- `StorageRepository` is the only writer to browser storage.
- `ActionBroker` is the only UI-side caller of browser runtime messaging.
- `ActionBroker` is the only writer to Redux for background-originated state.
- Browser APIs live only in `src/Background/Adapters`,
  `src/Background/Repositories`, or `src/Shared/Adapters`.
- Services are plain arrow functions and receive dependencies as parameters.
- Trust boundaries use type guards/codecs, not `unknown`, `any`, or `as`.

## Sequence

### Phase 0: freeze the map

Use #270 to produce a checked mapping of every current `src/*` folder and root
`src/*.ts(x)` entrypoint to its target layer.

Rules:

- Target roots are `src/Background`, `src/UI`, and `src/Shared`.
- Use `PascalCase` folders/files.
- Use domain subfolders even for one-file domains.
- Move source tests with source files; keep true integration/E2E tests outside.
- Use the existing `@/* -> src/*` alias.
- Do not convert `chrome.*` to `browser.*` yet.
- Mark bridge leftovers as `Legacy*` instead of giving them final names.

Gate:

- Inventory exists and every source file has one target or a named deferral.

### Phase 1: folder and naming move

Implement #270 as a mechanical move/rename PR.

Expected shape:

- `src/Background/Services/<Domain>/*`
- `src/Background/Adapters/<Domain>/*`
- `src/Background/Repositories/Storage/*`
- `src/UI/Pages/*`
- `src/UI/Views/*`
- `src/UI/Components/*`
- `src/UI/Hooks/*`
- `src/UI/Redux/store.ts`
- `src/UI/Redux/Slices/<Domain>/*`
- `src/UI/Redux/Selectors/<Domain>/*`
- `src/Shared/Adapters/ActionBroker.ts`
- `src/Shared/Types/*`
- `src/Shared/Constants/*`

Gate:

- Build and tests pass after import updates.
- No behavior rewrite beyond import and entrypoint changes.

### Phase 2: ActionBroker boundary

Implement #271 and reconcile it with #264.

Replace legacy bridge code shaped as:

- `*Client.ts`
- `*ConnectionAwareClient.ts`
- `*ConnectionManager.ts`
- `*ProjectionSubscription.ts`
- UI direct `runtime.sendMessage` calls

with one `src/Shared/Adapters/ActionBroker.ts` API.

Gate:

- UI pages/hooks/components do not call runtime messaging directly.
- `src/UI/Redux` contains only store setup, slices, selectors, and tests.
- Background-originated state enters Redux through ActionBroker-owned dispatch.

### Phase 3: StorageRepository single writer

Implement #266 and #268 together or back-to-back.

Move all storage writes behind
`src/Background/Repositories/Storage/StorageRepository.ts`.

Known current violations:

- onboarding progress writes
- personalization quiz progress writes
- access context publisher writes
- Redux storage middleware writes
- production composition using in-memory persistence adapters

Gate:

- Browser storage write search returns only StorageRepository or its browser
  adapter.
- Production background composition uses real browser persistence, not in-memory
  adapters.
- UI no longer persists Redux state directly.

### Phase 4: browser API containment and polyfill

Implement #263 after Phase 1 paths exist.

Move all browser API calls into approved adapter/repository/broker locations and
standardize on WebExtension `browser.*` where the architecture requires it.

Gate:

- `chrome.*` and `browser.*` search shows browser API usage only in:
  `src/Background/Adapters`, `src/Background/Repositories`, and
  `src/Shared/Adapters/ActionBroker.ts`.
- Services and UI contain no browser API calls.

### Phase 5: background services and dependency injection

Refactor background logic so services are the deep modules and
adapters/repositories are thin.

Targets:

- `SchedulerService`
- `BlockListManagementService`
- `BrowserEnforcementService`
- notification/tab adapters
- storage repository

Rules:

- Services are plain arrow functions, not classes.
- Services import types/constants only from Shared.
- Services receive all adapters/repositories as function parameters.
- No business logic in adapters, repositories, Redux, or UI components.

Gate:

- Background services can be tested with in-memory dependencies.
- Background adapters/repositories contain side-effect code only.

### Phase 6: type-boundary cleanup

Implement #267 after files are in their final layers.

Replace boundary `unknown`/`as` parsing with named type guards/codecs in the
layer that owns the boundary.

Gate:

- Trust-boundary parsers validate input before use.
- Unsafe casts are removed or quarantined behind reviewed guards.
- Tests cover malformed input for each boundary codec touched.

### Phase 7: UI read model cleanup

Clean remaining UI flow so components do not own business logic or
storage/messaging effects.

Rules:

- Components render and call hooks.
- Hooks call ActionBroker for commands and selectors for state.
- Redux stores background projections/read models only.
- Selectors own read derivation; slices own state transitions only.

Gate:

- No Redux dispatches directly in components for background commands.
- No storage reads/writes in components.
- No browser API calls in UI.

### Phase 8: docs and enforcement

Finish #265 and add small enforcement checks so architecture does not drift.

Minimum enforcement:

- Update docs references to `docs/architecture-v2.md`.
- Add or update architecture lint/search checks for:
  - browser API locations
  - direct storage writers
  - direct UI runtime messaging
  - classes in production source
  - forbidden UI -> Background imports

Gate:

- `npm run verify` or equivalent project verification passes.
- Architecture checks fail on the old violation patterns.

## Verification

Run the smallest useful check for the touched layer during each phase, then run
full project verification before opening a PR:

```bash
npm run verify
npm run build
npm run package:safari
```

Do not merge a phase without full project verification.

## Do not do

- Do not combine mechanical moves with behavior rewrites.
- Do not create service interfaces with one implementation.
- Do not hide legacy bridge/storage files behind final architecture names.
- Do not move intact modules if their files belong in different layers.
- Do not use folder cleanup as an excuse to add new runtime behavior.
